import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flightService } from './flight-service';
import type { Flight } from '../models/flight';

const now = new Date().getTime();
const past = new Date(now - 1000 * 60 * 60).toISOString(); 
const future = new Date(now + 1000 * 60 * 60).toISOString(); 
const closePast = new Date(now - 1000 * 60 * 30).toISOString(); 
const closeFuture = new Date(now + 1000 * 60 * 30).toISOString(); 

const mockFlights: any[] = [
  {
    flight_status: "active",
    departure: { scheduled: past },
    arrival: { scheduled: future },
    airline: { name: "Iberia" },
    flight: { iata: "IB3166" }
  }
];

describe('FlightService', () => {
  beforeEach(() => {
    flightService._reset();
    
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockFlights }),
    });
    
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    flightService._reset();
    // Limpiamos cache privada simulando la destrucción del servicio
    (flightService as any).livePlanesCache = null;
  });

  it('debería fetchear los vuelos si no están en caché', async () => {
    const flights = await flightService.getFlights();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(flights.length).toBeGreaterThan(0);
  });

  it('debería leer de localStorage si los datos son recientes', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === 'aerolit_flights_cache_time') return now.toString();
      if (key === 'aerolit_flights_cache_v2') return JSON.stringify(mockFlights);
      return null;
    });

    const flights = await flightService.getFlights();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(flights.length).toBe(mockFlights.length);
  });

  it('debería fetchear si el payload no es { data: [] } sino un array directo', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ flight_status: 'active', departure: { scheduled: past } }]),
    });
    const flights = await flightService.getFlights();
    expect(flights.length).toBe(1);
  });

  it('debería hacer fallback a caché local si la red falla', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === 'aerolit_flights_cache_v2') return JSON.stringify(mockFlights);
      return null;
    });
    
    const flights = await flightService.getFlights();
    expect(flights.length).toBe(mockFlights.length);
  });

  it('debería ignorar errores al guardar en localStorage (QuotaExceeded)', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceeded'); });
    const flights = await flightService.getFlights();
    expect(flights.length).toBe(mockFlights.length);
  });

  it('debería calcular correctamente los KPIs y sus tendencias', async () => {
    const flightsToTest = [
      { flight_status: 'scheduled', departure: { scheduled: closeFuture } },
      { flight_status: 'active', departure: { scheduled: closePast } },
      { flight_status: 'landed', departure: { scheduled: past } }
    ];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: flightsToTest }),
    });

    const stats = await flightService.getKpiStats();
    expect(stats.activeTrend).toContain('despegues en la última hr');
    expect(stats.scheduledTrend).toContain('despegues prox. hr');
  });

  it('debería agrupar correctamente en getFlightsByTime', async () => {
    const stats = await flightService.getFlightsByTime();
    expect(stats.labels.length).toBe(24);
    expect(stats.data.length).toBe(24);
    const hasData = stats.data.some(d => d > 0);
    expect(hasData).toBe(true);
  });

  it('debería usar HybridEngine para polling periódico', async () => {
    const cb = vi.fn();
    flightService.startHybridEngine(cb);
    
    // El engine ejecuta updateStatuses localmente pero también lanza getFlights(true) en el timer.
    // Depende del intervalo (1 hora = 3600000 ms, 1 min = 60000 ms)
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000); 
    
    expect(cb).toHaveBeenCalled();
    
    flightService.stopHybridEngine();
  });

  it('debería obtener aviones en vivo de OpenSky y cachearlos', async () => {
    const mockStates = {
      states: [
        ["4b1815", "SWR94P", "Switzerland", 1680517559, 1680517559, 8.5284, 47.4721, 6301.74, false, 203.49, 172.93, 0, null, 6423.66, null, false, 0]
      ]
    };
    
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStates),
    });

    const planes = await flightService.getLivePlanes();
    expect(planes.length).toBe(1);
    
    (globalThis.fetch as any).mockClear();
    const planesCached = await flightService.getLivePlanes();
    expect(planesCached.length).toBe(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(0);
  });

  it('debería devolver array vacío si falla OpenSky', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('OpenSky Error'));
    const planes = await flightService.getLivePlanes();
    expect(planes).toEqual([]);
  });
});
