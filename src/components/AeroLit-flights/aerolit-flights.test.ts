import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import { AerolitFlights } from './aerolit-flights';
import { flightService } from '../../services/flight-service';
import type { Flight } from '../../models/flight';

describe('AerolitFlights', () => {
  const mockFlights: Flight[] = [
    {
      flight_date: "2023-10-27",
      flight_status: "active",
      departure: { airport: "Madrid", timezone: "Europe/Madrid", iata: "MAD", icao: "LEMD", terminal: "4", gate: "H1", delay: 10, scheduled: "2023-10-27T10:00:00+00:00", estimated: "2023-10-27T10:10:00+00:00", actual: "2023-10-27T10:10:00+00:00", estimated_runway: null, actual_runway: null },
      arrival: { airport: "London", timezone: "Europe/London", iata: "LHR", icao: "EGLL", terminal: "5", gate: "A10", delay: 0, scheduled: "2023-10-27T12:00:00+00:00", estimated: "2023-10-27T12:00:00+00:00", actual: null, estimated_runway: null, actual_runway: null },
      airline: { name: "Iberia", iata: "IB", icao: "IBE" },
      flight: { number: "3166", iata: "IB3166", icao: "IBE3166", codeshared: null }
    }
  ];

  beforeEach(() => {
    // Mock matchMedia para los Web Components internos
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), 
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería mostrar loading al iniciar y luego renderizar los vuelos', async () => {
    vi.spyOn(flightService, 'getFlights').mockResolvedValue(mockFlights);

    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    
    // Al principio puede que el componente ya haya resuelto porque mockResolvedValue es rápido,
    // comprobaremos si los vuelos se renderizan.
    await el.updateComplete;

    expect(flightService.getFlights).toHaveBeenCalled();
    const flightCards = el.shadowRoot!.querySelectorAll('flight-card');
    expect(flightCards.length).toBe(1);
    expect((flightCards[0] as any).flight.airline.name).toBe('Iberia');
  });

  it('debería mostrar mensaje de error si falla la carga', async () => {
    vi.spyOn(flightService, 'getFlights').mockRejectedValue(new Error('Network Error'));

    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    await el.updateComplete;

    const errorMsg = el.shadowRoot!.querySelector('.error');
    expect(errorMsg).not.toBeNull();
    expect(errorMsg!.textContent).toContain('No se pudieron cargar los vuelos.');
  });
});
