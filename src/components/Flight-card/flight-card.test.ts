import { describe, it, expect, beforeEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import { FlightCard } from './flight-card';
import type { Flight } from '../../models/flight';

describe('FlightCard Component', () => {
  let element: FlightCard;

  const mockFlight: Flight = {
    flight_date: "2024-10-15",
    flight_status: "scheduled",
    departure: {
      airport: "San Francisco International",
      timezone: "America/Los_Angeles",
      iata: "SFO",
      icao: "KSFO",
      terminal: "2",
      gate: "D11",
      delay: 15,
      scheduled: "2024-10-15T14:30:00+00:00",
      estimated: "2024-10-15T14:45:00+00:00",
      actual: null,
      estimated_runway: null,
      actual_runway: null
    },
    arrival: {
      airport: "Dallas/Fort Worth International",
      timezone: "America/Chicago",
      iata: "DFW",
      icao: "KDFW",
      terminal: "A",
      gate: "A22",
      baggage: "A4",
      delay: 0,
      scheduled: "2024-10-15T19:45:00+00:00",
      estimated: "2024-10-15T19:45:00+00:00",
      actual: null,
      estimated_runway: null,
      actual_runway: null
    },
    airline: {
      name: "American Airlines",
      iata: "AA",
      icao: "AAL"
    },
    flight: {
      number: "1024",
      iata: "AA1024",
      icao: "AAL1024",
      codeshared: null
    }
  };

  beforeEach(async () => {
    element = await fixture(html`<flight-card .flight=${mockFlight}></flight-card>`);
  });

  it('debería renderizar la aerolínea y estado', () => {
    const airline = element.shadowRoot?.querySelector('.airline')?.textContent;
    expect(airline).toContain('American Airlines');
    expect(airline).toContain('AA1024');

    const status = element.shadowRoot?.querySelector('.status');
    expect(status?.textContent).toBe('scheduled');
  });

  it('debería tener la clase cancelled si el vuelo está cancelado', async () => {
    const cancelledFlight = { ...mockFlight, flight_status: 'cancelled' } as Flight;
    element = await fixture(html`<flight-card .flight=${cancelledFlight}></flight-card>`);
    
    const status = element.shadowRoot?.querySelector('.status');
    expect(status?.classList.contains('cancelled')).toBe(true);
  });

  it('debería tener la clase active si el vuelo está activo', async () => {
    const activeFlight = { ...mockFlight, flight_status: 'active' } as Flight;
    element = await fixture(html`<flight-card .flight=${activeFlight}></flight-card>`);
    
    const status = element.shadowRoot?.querySelector('.status');
    expect(status?.classList.contains('active')).toBe(true);
  });

  it('debería no renderizar nada si no hay vuelo', async () => {
    element = await fixture(html`<flight-card></flight-card>`);
    // En Lit, shadowRoot nunca es un string vacío puro porque inyecta los estilos (<style>)
    // y comentarios HTML ocultos (<!---->). Lo correcto es comprobar que no renderiza la estructura.
    const header = element.shadowRoot?.querySelector('.header');
    expect(header).toBeNull();
  });
});
