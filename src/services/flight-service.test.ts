import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flightService } from './flight-service';
import type { Flight } from '../models/flight';

describe('FlightService', () => {
  const mockFlights: Flight[] = [
    {
      flight_date: "2023-10-27",
      flight_status: "active",
      departure: { airport: "Madrid", timezone: "Europe/Madrid", iata: "MAD", icao: "LEMD", terminal: "4", gate: "H1", delay: 10, scheduled: "2023-10-27T10:00:00+00:00", estimated: "2023-10-27T10:10:00+00:00", actual: "2023-10-27T10:10:00+00:00", estimated_runway: null, actual_runway: null },
      arrival: { airport: "London", timezone: "Europe/London", iata: "LHR", icao: "EGLL", terminal: "5", gate: "A10", delay: 0, scheduled: "2023-10-27T12:00:00+00:00", estimated: "2023-10-27T12:00:00+00:00", actual: null, estimated_runway: null, actual_runway: null },
      airline: { name: "Iberia", iata: "IB", icao: "IBE" },
      flight: { number: "3166", iata: "IB3166", icao: "IBE3166", codeshared: null }
    },
    {
      flight_date: "2023-10-27",
      flight_status: "cancelled",
      departure: { airport: "Barcelona", timezone: "Europe/Madrid", iata: "BCN", icao: "LEBL", terminal: "1", gate: "B2", delay: null, scheduled: "2023-10-27T14:00:00+00:00", estimated: "2023-10-27T14:00:00+00:00", actual: null, estimated_runway: null, actual_runway: null },
      arrival: { airport: "Paris", timezone: "Europe/Paris", iata: "CDG", icao: "LFPG", terminal: "2F", gate: "F20", delay: null, scheduled: "2023-10-27T16:00:00+00:00", estimated: "2023-10-27T16:00:00+00:00", actual: null, estimated_runway: null, actual_runway: null },
      airline: { name: "Vueling", iata: "VY", icao: "VLG" },
      flight: { number: "8024", iata: "VY8024", icao: "VLG8024", codeshared: null }
    }
  ];

  beforeEach(() => {
    flightService._reset();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería fetchear los vuelos si no están en caché', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockFlights })
    });

    const flights = await flightService.getFlights();
    
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith('/src/assets/mock-flights.json');
    expect(flights).toEqual(mockFlights);
  });

  it('no debería fetchear los vuelos si ya están en caché', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockFlights })
    });

    // Primera llamada (hace el fetch)
    await flightService.getFlights();
    // Segunda llamada (debería usar caché)
    const flights = await flightService.getFlights();
    
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(flights).toEqual(mockFlights);
  });

  it('debería calcular correctamente los KPIs', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockFlights })
    });

    const stats = await flightService.getKpiStats();
    
    expect(stats.total).toBe(2);
    expect(stats.active).toBe(1);
    expect(stats.cancelled).toBe(1);
    expect(stats.scheduled).toBe(0);
  });

  it('debería devolver un array vacío si la respuesta no tiene data', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    const flights = await flightService.getFlights();
    expect(flights).toEqual([]);
  });

  it('debería lanzar un error si falla el fetch', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      statusText: 'Not Found'
    });

    await expect(flightService.getFlights()).rejects.toThrow('Network response was not ok: Not Found');
  });
});
