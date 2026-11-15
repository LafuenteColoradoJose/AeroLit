/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import https from 'https';
import { OpenSkyScraper, RADAR_CENTERS, RADAR_RADIUS_NM } from './opensky-scraper';

// Mock de https para no realizar peticiones reales durante los tests.
vi.mock('https', () => ({
  default: {
    request: vi.fn(),
  },
}));

/** Describe una respuesta simulada de ADSB.lol para una petición concreta. */
interface MockResponse {
  /** Código HTTP simulado (200 por defecto). */
  statusCode?: number;
  /** Cuerpo de la respuesta. */
  body?: string;
  /** Simula un error de red. */
  error?: boolean;
  /** Simula un timeout. */
  timeout?: boolean;
}

describe('OpenSkyScraper (ADSB.lol)', () => {
  let scraper: OpenSkyScraper;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    scraper = new OpenSkyScraper();
  });

  afterEach(() => {
    scraper.stop();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /**
   * Configura el mock de `https.request` con una secuencia de respuestas.
   * La última respuesta se reutiliza si se realizan más peticiones que elementos.
   *
   * @param {MockResponse[]} responses - Respuestas simuladas por orden de llamada.
   * @returns {{ calls: any[]; requests: any[] }} Opciones y requests capturados.
   */
  const mockResponses = (responses: MockResponse[]) => {
    let callIndex = 0;
    const calls: any[] = [];
    const requests: any[] = [];

    (https.request as any).mockImplementation((options: any, callback: any) => {
      calls.push(options);
      const spec = responses[Math.min(callIndex, responses.length - 1)] ?? {
        statusCode: 200,
        body: '{"ac":[]}',
      };
      callIndex++;

      const res = {
        statusCode: spec.statusCode ?? 200,
        on: vi.fn((event: string, handler: any) => {
          if (event === 'data' && spec.body) handler(spec.body);
          if (event === 'end') handler();
        }),
      };

      const req = {
        on: vi.fn((event: string, handler: any) => {
          if (event === 'error' && spec.error) handler(new Error('Network error simulated'));
          if (event === 'timeout' && spec.timeout) handler();
        }),
        end: vi.fn(() => {
          if (!spec.error && !spec.timeout) {
            callback(res);
          }
        }),
        destroy: vi.fn(),
      };

      requests.push(req);
      return req;
    });

    return { calls, requests };
  };

  it('consulta todos los centros con el radio permitido y normaliza las aeronaves', async () => {
    const body = JSON.stringify({
      ac: [
        { hex: 'abc123', flight: 'IBE123 ', lat: 40.4, lon: -3.7, alt_baro: 30000, gs: 450, track: 90 },
        { hex: 'def456', flight: 'RYR1', lat: 41.2, lon: 2.1, alt_baro: 'ground', gs: 0, track: 0 },
        { hex: 'bad999', flight: 'NOCOORDS', lat: null, lon: null },
      ],
    });
    const { calls } = mockResponses([{ statusCode: 200, body }]);

    const result = await scraper.getPlanes();

    expect(https.request).toHaveBeenCalledTimes(RADAR_CENTERS.length);
    expect(RADAR_RADIUS_NM).toBeLessThanOrEqual(250);
    expect(calls.every(options => options.path.endsWith(`/dist/${RADAR_RADIUS_NM}`))).toBe(true);
    expect(result.data.states).toHaveLength(2);

    const airborne = result.data.states[0];
    expect(airborne[0]).toBe('abc123');
    expect(airborne[1]).toBe('IBE123');
    expect(airborne[2]).toBe('España');
    expect(airborne[5]).toBeCloseTo(-3.7);
    expect(airborne[6]).toBeCloseTo(40.4);
    expect(airborne[7]).toBeCloseTo(30000 / 3.28084, 4);
    expect(airborne[8]).toBe(false);
    expect(airborne[9]).toBeCloseTo(450 * 0.514444, 4);
    expect(airborne[10]).toBe(90);

    const grounded = result.data.states[1];
    expect(grounded[7]).toBe(0);
    expect(grounded[8]).toBe(true);

    expect(result.lastUpdate).toBeInstanceOf(Date);
  });

  it('deduplica aeronaves repetidas entre centros por su código hex', async () => {
    const body = JSON.stringify({
      ac: [
        { hex: 'dup001', flight: 'A1', lat: 40, lon: -3, alt_baro: 10000 },
        { hex: 'dup001', flight: 'A1', lat: 40, lon: -3, alt_baro: 10000 },
        { hex: 'dup002', flight: 'A2', lat: 41, lon: 2, alt_baro: 12000 },
      ],
    });
    mockResponses([{ statusCode: 200, body }]);

    const result = await scraper.getPlanes();

    expect(result.data.states).toHaveLength(2);
    expect(result.data.states.map(state => state[0])).toEqual(['dup001', 'dup002']);
  });

  it('conserva los datos de los centros que responden aunque otros fallen', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const body = JSON.stringify({ ac: [{ hex: 'abc123', lat: 40, lon: -3, alt_baro: 10000 }] });
    mockResponses([
      { statusCode: 200, body },
      { statusCode: 403, body: 'radius exceeds 250 NM' },
      { statusCode: 500, body: 'server error' },
      { timeout: true },
      { error: true },
    ]);

    const result = await scraper.getPlanes();

    expect(result.data.states).toHaveLength(1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('403'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('500'));
    expect(consoleSpy).toHaveBeenCalledWith('[Radar] Error de red: Network error simulated');
  });

  it('conserva el último snapshot válido si todos los centros fallan', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const body = JSON.stringify({ ac: [{ hex: 'abc123', lat: 40, lon: -3, alt_baro: 10000 }] });

    mockResponses([{ statusCode: 200, body }]);
    const first = await scraper.getPlanes();
    expect(first.data.states).toHaveLength(1);
    expect(first.lastUpdate).not.toBeNull();

    await vi.advanceTimersByTimeAsync(11_000);
    mockResponses([{ statusCode: 403, body: 'radius exceeds 250 NM' }]);
    const second = await scraper.getPlanes();

    expect(second.data.states).toHaveLength(1);
    expect(second.lastUpdate).toEqual(first.lastUpdate);
    expect(warnSpy).toHaveBeenCalledWith(
      '[Radar] ADSB.lol no devolvió aeronaves; se conserva el último snapshot válido.',
    );
  });

  it('ignora respuestas con JSON inválido', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockResponses([{ statusCode: 200, body: '{ JSON INVALIDO }' }]);

    const result = await scraper.getPlanes();

    expect(result.data.states).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalledWith('[Radar] Error parseando JSON de ADSB.lol');
  });

  it('ignora respuestas cuyo campo ac no es un array', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockResponses([{ statusCode: 200, body: JSON.stringify({ ac: 'no-es-un-array' }) }]);

    const result = await scraper.getPlanes();

    expect(result.data.states).toHaveLength(0);
  });

  it('hace lazy fetch solo cuando caduca la caché de 10 segundos', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockResponses([{ statusCode: 200, body: JSON.stringify({ ac: [] }) }]);

    await scraper.getPlanes();
    expect(https.request).toHaveBeenCalledTimes(RADAR_CENTERS.length);

    await scraper.getPlanes();
    expect(https.request).toHaveBeenCalledTimes(RADAR_CENTERS.length);

    await vi.advanceTimersByTimeAsync(11_000);
    await scraper.getPlanes();
    expect(https.request).toHaveBeenCalledTimes(RADAR_CENTERS.length * 2);
  });

  it('no lanza barridos concurrentes si se piden posiciones a la vez', async () => {
    mockResponses([{ statusCode: 200, body: JSON.stringify({ ac: [] }) }]);

    await Promise.all([scraper.getPlanes(), scraper.getPlanes(), scraper.getPlanes()]);

    expect(https.request).toHaveBeenCalledTimes(RADAR_CENTERS.length);
  });

  it('destruye la petición si se produce un timeout', async () => {
    const { requests } = mockResponses([{ statusCode: 200, body: '', timeout: true }]);

    await scraper.getPlanes();

    expect(requests).toHaveLength(RADAR_CENTERS.length);
    requests.forEach(request => expect(request.destroy).toHaveBeenCalled());
  });

  it('registra el error de red cuando falla la conexión', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockResponses([{ statusCode: 200, body: '', error: true }]);

    await scraper.getPlanes();

    expect(consoleSpy).toHaveBeenCalledWith('[Radar] Error de red: Network error simulated');
  });
});
