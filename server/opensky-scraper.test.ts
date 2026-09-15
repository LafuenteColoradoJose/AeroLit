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

  it('debería fetchear los aviones correctamente al iniciarse (200 OK y JSON válido)', () => {
    const validJson = JSON.stringify({ states: [['mockPlane1'], ['mockPlane2']] });
    mockHttpsRequest(200, validJson);

    scraper = new OpenSkyScraper(); // El constructor llama a scrapeRadar()

    const result = scraper.getPlanes();
    expect(result.data.states.length).toBe(2);
    expect(result.lastUpdate).not.toBeNull();
  });

  it('debería ignorar la respuesta si el JSON es inválido', () => {
    // Espiamos console.error para no ensuciar el log del test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockHttpsRequest(200, '{ JSON INVALIDO }');
    scraper = new OpenSkyScraper();
    
    const result = scraper.getPlanes();
    // Debe devolver el default vacío { states: [] }
    expect(result.data.states.length).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith('[Radar] Error parseando JSON de OpenSky');
    
    consoleSpy.mockRestore();
  });

  it('debería ignorar si el statusCode no es 200', () => {
    const validJson = JSON.stringify({ states: [['mockPlane1']] });
    mockHttpsRequest(429, validJson); // Simula un Too Many Requests
    scraper = new OpenSkyScraper();
    
    const result = scraper.getPlanes();
    expect(result.data.states.length).toBe(0); // Sigue vacío
  });

  it('debería manejar errores de red (req.on("error"))', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockHttpsRequest(200, '', true, false); // triggerError = true
    scraper = new OpenSkyScraper();
    
    expect(consoleSpy).toHaveBeenCalledWith('[Radar] Error de red: Network error simulated');
    
    consoleSpy.mockRestore();
  });

  it('debería destruir la request si hay timeout (req.on("timeout"))', () => {
    const mocks = mockHttpsRequest(200, '', false, true); // triggerTimeout = true
    scraper = new OpenSkyScraper();
    
    expect(mocks.req.destroy).toHaveBeenCalled();
  });

  it('debería volver a hacer fetch cada 15 segundos', () => {
    const validJson = JSON.stringify({ states: [] });
    mockHttpsRequest(200, validJson);
    
    scraper = new OpenSkyScraper();
    
    expect(https.request).toHaveBeenCalledTimes(1);
    
    // Avanzamos el tiempo 15 segundos
    vi.advanceTimersByTime(15 * 1000);
    expect(https.request).toHaveBeenCalledTimes(2);

    // Avanzamos otros 15 segundos
    vi.advanceTimersByTime(15 * 1000);
    expect(https.request).toHaveBeenCalledTimes(3);
  });
});
