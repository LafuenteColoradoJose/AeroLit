/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AenaScraper } from './aena-scraper';
import https from 'https';

class MockRequest {
  events: Record<string, Function> = {};
  on(event: string, cb: Function) {
    this.events[event] = cb;
    return this;
  }
  end() {}
  destroy() {}
}

describe('AenaScraper', () => {
  let requestSpy: any;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('debería inicializarse, barrer vuelos y mapearlos correctamente', async () => {
    requestSpy = vi.spyOn(https, 'request').mockImplementation((options, cb: any) => {
      const mockReq = new MockRequest();
      const mockRes = {
        on: (event: string, listener: Function) => {
          if (event === 'data') {
            listener(JSON.stringify([
              { 
                fecha: '15/09/2026', 
                horaProgramada: '12:00',
                tipoVuelo: 'S',
                iataAena: 'MAD',
                iataOtro: 'OVD',
                estado: 'Aterrizado',
                compania: 'Iberia',
                iataCompania: 'IB',
                numVuelo: '3166',
                terminal: 'T4',
                puertaPrimera: 'K12'
              },
              { 
                fecha: '15/09/2026', 
                horaProgramada: '15:00',
                tipoVuelo: 'L',
                iataAena: 'BCN',
                iataOtro: 'MAD',
                estado: 'Cancelado',
                nombreCompania: 'Vueling',
                iataCompania: 'VY',
                numVuelo: '1234',
                ciudadIataOtro: 'Madrid'
              },
              { 
                tipoVuelo: 'S',
                iataAena: 'AGP',
                estado: 'Desconocido'
              }
            ]));
          }
          if (event === 'end') listener();
        }
      };
      cb(mockRes);
      return mockReq as any;
    });

    const scraper = new AenaScraper();
    
    // Avanzar el tiempo para saltar los delay de 100ms de los 48 aeropuertos
    for (let i = 0; i < 50; i++) {
        await vi.advanceTimersByTimeAsync(150);
    }

    const result = scraper.getFlights();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);

    const landed = result.data.find(f => f.flight_status === 'landed');
    expect(landed).toBeDefined();
    expect(landed?.departure.terminal).toBe('T4');
    
    const cancelled = result.data.find(f => f.flight_status === 'cancelled');
    expect(cancelled).toBeDefined();
    expect(cancelled?.airline.name).toBe('Vueling');

    const scheduled = result.data.find(f => f.flight_status === 'scheduled');
    expect(scheduled).toBeDefined();
    expect(scheduled?.airline.name).toBe('Unknown');
  });

  it('debería soportar errores de red y timeouts gracefully', async () => {
    requestSpy = vi.spyOn(https, 'request').mockImplementation((options, cb: any) => {
      const mockReq = new MockRequest();
      const mockRes = {
        on: (event: string, listener: Function) => {
          if (event === 'data') listener('JSON-CORRUPTO');
          if (event === 'end') listener();
        }
      };
      cb(mockRes);
      
      setTimeout(() => {
        if (mockReq.events['timeout']) mockReq.events['timeout']();
      }, 10);
      
      return mockReq as any;
    });

    const scraper = new AenaScraper();
    
    for (let i = 0; i < 50; i++) {
        await vi.advanceTimersByTimeAsync(150);
    }

    const result = scraper.getFlights();
    expect(result.data).toBeInstanceOf(Array);
  });

  it('debería soportar un evento de error de red global', async () => {
    requestSpy = vi.spyOn(https, 'request').mockImplementation((options, cb: any) => {
      const mockReq = new MockRequest();
      setTimeout(() => {
        if (mockReq.events['error']) mockReq.events['error'](new Error('Network error'));
      }, 10);
      return mockReq as any;
    });

    const scraper = new AenaScraper();
    
    for (let i = 0; i < 50; i++) {
        await vi.advanceTimersByTimeAsync(150);
    }

    const result = scraper.getFlights();
    expect(result.data).toBeInstanceOf(Array);
  });
});
