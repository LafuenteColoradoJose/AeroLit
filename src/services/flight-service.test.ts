import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flightService } from './flight-service';
import type { Flight } from '../models/flight';

const now = new Date().getTime();
const past = new Date(now - 1000 * 60 * 60).toISOString(); // 1 hr ago
const future = new Date(now + 1000 * 60 * 60).toISOString(); // 1 hr future

const mockFlights: any[] = [
  {
    flight_date: "2026-09-11",
    flight_status: "active",
    departure: { scheduled: past },
    arrival: { scheduled: future },
    airline: { name: "Iberia" },
    flight: { iata: "IB3166" }
  },
  {
    flight_date: "2026-09-11",
    flight_status: "cancelled",
    departure: { scheduled: past },
    arrival: { scheduled: future },
    airline: { name: "Vueling" },
    flight: { iata: "VY7820" }
  }
];

describe('FlightService', () => {
  beforeEach(() => {
    flightService._reset();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockFlights }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    flightService._reset();
  });

  it('debería fetchear los vuelos si no están en caché', async () => {
    const flights = await flightService.getFlights();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(flights[0].flight_status).toBe('active');
    expect(flights[1].flight_status).toBe('cancelled');
  });

  it('no debería fetchear los vuelos si ya están en caché', async () => {
    await flightService.getFlights();
    (globalThis.fetch as any).mockClear();

    const flights = await flightService.getFlights();
    expect(globalThis.fetch).toHaveBeenCalledTimes(0);
    expect(flights[0].flight_status).toBe('active');
  });

  it('debería calcular correctamente los KPIs', async () => {
    const stats = await flightService.getKpiStats();
    expect(stats.total).toBe(2);
    expect(stats.active).toBe(1);
    expect(stats.cancelled).toBe(1);
    expect(stats.scheduled).toBe(0);
    expect(stats.landed).toBe(0);
  });

  it('debería filtrar vuelos urgentes correctamente', async () => {
    const urgent = await flightService.getUrgentFlights();
    expect(urgent.length).toBe(1);
    expect(urgent[0].flight.iata).toBe('VY7820');
  });

  it('debería lanzar un error si falla el fetch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(flightService.getFlights(true)).rejects.toThrow('Network response was not ok: Not Found');
  });

  it('debería devolver los próximos vuelos programados ordenados y en el futuro', async () => {
    const f1 = new Date(now + 60 * 60 * 1000).toISOString(); 
    const f2 = new Date(now + 2 * 60 * 60 * 1000).toISOString(); 
    const p = new Date(now - 60 * 60 * 1000).toISOString(); 

    const localMock = [
      { flight_status: 'scheduled', departure: { scheduled: f2 } },
      { flight_status: 'active', departure: { scheduled: p } },
      { flight_status: 'scheduled', departure: { scheduled: f1 } },
      { flight_status: 'scheduled', departure: { scheduled: p } } 
    ];
    
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: localMock })
    });

    const upcoming = await flightService.getUpcomingFlights(5);
    expect(upcoming.length).toBe(2);
    expect(upcoming[0].departure.scheduled).toBe(f1);
    expect(upcoming[1].departure.scheduled).toBe(f2);
  });
});
