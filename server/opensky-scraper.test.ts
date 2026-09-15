/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import https from 'https';
import { OpenSkyScraper } from './opensky-scraper';

// Mock de https
vi.mock('https', () => ({
  default: {
    request: vi.fn(() => ({
      on: vi.fn(),
      end: vi.fn(),
      destroy: vi.fn()
    })),
  },
}));

describe('OpenSkyScraper', () => {
  let scraper: OpenSkyScraper;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (scraper) {
      scraper.stop();
    }
    vi.useRealTimers();
  });

  // Helper para simular req/res de HTTPS
  const mockHttpsRequest = (
    statusCode: number,
    responseData: string,
    triggerError?: boolean,
    triggerTimeout?: boolean
  ) => {
    const res = {
      statusCode,
      on: vi.fn((event: string, callback: any) => {
        if (event === 'data' && responseData) {
          callback(responseData);
        }
        if (event === 'end') {
          callback();
        }
      }),
    };

    const req = {
      on: vi.fn((event: string, callback: any) => {
        if (event === 'error' && triggerError) {
          callback(new Error('Network error simulated'));
        }
        if (event === 'timeout' && triggerTimeout) {
          callback();
        }
      }),
      end: vi.fn(),
      destroy: vi.fn(),
    };

    (https.request as any).mockImplementation((options: any, callback: any) => {
      if (callback && !triggerError && !triggerTimeout) {
        callback(res);
      }
      return req;
    });

    return { req, res };
  };

  it('debería fetchear los aviones correctamente al iniciarse (200 OK y JSON válido)', async () => {
    const validJson = JSON.stringify({ ac: [{hex:'1'}, {hex:'2'}] });
    mockHttpsRequest(200, validJson);

    scraper = new OpenSkyScraper(); // El constructor llama a scrapeRadar()

    const result = await scraper.getPlanes();
    expect(result.data.states.length).toBe(2);
    expect(result.lastUpdate).not.toBeNull();
  });

  it('debería ignorar la respuesta si el JSON es inválido', async () => {
    // Espiamos console.error para no ensuciar el log del test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockHttpsRequest(200, '{ JSON INVALIDO }');
    scraper = new OpenSkyScraper();
    
    const result = await scraper.getPlanes();
    // Debe devolver el default vacío { states: [] }
    expect(result.data.states.length).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith('[Radar] Error parseando JSON de ADSB.lol');
    
    consoleSpy.mockRestore();
  });

  it('debería ignorar si el statusCode no es 200', async () => {
    const validJson = JSON.stringify({ states: [['mockPlane1']] });
    mockHttpsRequest(429, validJson); // Simula un Too Many Requests
    scraper = new OpenSkyScraper();
    
    const result = await scraper.getPlanes();
    expect(result.data.states.length).toBe(0); // Sigue vacío
  });

  it('debería manejar errores de red (req.on("error"))', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockHttpsRequest(200, '', true, false);
    scraper = new OpenSkyScraper();
    
    await scraper.getPlanes();
    expect(consoleSpy).toHaveBeenCalledWith('[Radar] Error de red: Network error simulated');
    
    consoleSpy.mockRestore();
  });

  it('debería destruir la request si hay timeout (req.on("timeout"))', async () => {
    const mocks = mockHttpsRequest(200, '', false, true);
    scraper = new OpenSkyScraper();
    
    await scraper.getPlanes();
    expect(mocks.req.destroy).toHaveBeenCalled();
  });

  it('debería hacer lazy fetch solo si la caché expiró (10 segundos)', async () => {
    const validJson = JSON.stringify({ states: [] });
    mockHttpsRequest(200, validJson);
    scraper = new OpenSkyScraper();
    await scraper.getPlanes();
    expect(https.request).toHaveBeenCalledTimes(1);
    await scraper.getPlanes();
    expect(https.request).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(11 * 1000);
    await scraper.getPlanes();
    expect(https.request).toHaveBeenCalledTimes(2);
  });
});
