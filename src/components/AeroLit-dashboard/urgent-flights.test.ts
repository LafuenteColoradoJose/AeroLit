import { fixture, html } from '@open-wc/testing';
import { expect, vi, describe, it, beforeEach, afterEach } from 'vitest';
import { flightService } from '../../services/flight-service';
import './urgent-flights';
import type { UrgentFlights } from './urgent-flights';
import type { Flight } from '../../models/flight';

describe('UrgentFlights', () => {
  const mockUrgentFlights: Flight[] = [
    {
      flight_date: "2023-10-27",
      flight_status: "cancelled",
      departure: { airport: "Madrid", timezone: "Europe/Madrid", iata: "MAD", icao: "LEMD", terminal: "1", gate: "A", delay: null, scheduled: "2023-10-27T10:00:00+00:00", estimated: "2023-10-27T10:00:00+00:00", actual: null, estimated_runway: null, actual_runway: null },
      arrival: { airport: "London", timezone: "Europe/London", iata: "LHR", icao: "EGLL", terminal: "2", gate: "B", delay: null, scheduled: "2023-10-27T12:00:00+00:00", estimated: "2023-10-27T10:00:00+00:00", actual: null, estimated_runway: null, actual_runway: null },
      airline: { name: "Iberia", iata: "IB", icao: "IBE" },
      flight: { number: "3166", iata: "IB3166", icao: "IBE3166", codeshared: null }
    },
    {
      flight_date: "2023-10-27",
      flight_status: "active",
      departure: { airport: "Barcelona", timezone: "Europe/Madrid", iata: "BCN", icao: "LEBL", terminal: "1", gate: "B2", delay: 45, scheduled: "2023-10-27T14:00:00+00:00", estimated: "2023-10-27T14:45:00+00:00", actual: "2023-10-27T14:45:00+00:00", estimated_runway: null, actual_runway: null },
      arrival: { airport: "Paris", timezone: "Europe/Paris", iata: "CDG", icao: "LFPG", terminal: "2F", gate: "F20", delay: 45, scheduled: "2023-10-27T16:00:00+00:00", estimated: "2023-10-27T16:45:00+00:00", actual: null, estimated_runway: null, actual_runway: null },
      airline: { name: "Vueling", iata: "VY", icao: "VLG" },
      flight: { number: "8024", iata: "VY8024", icao: "VLG8024", codeshared: null }
    }
  ];

  beforeEach(() => {
    vi.spyOn(flightService, 'getUrgentFlights').mockResolvedValue(mockUrgentFlights);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería renderizar la tabla con vuelos urgentes', async () => {
    const el = await fixture<UrgentFlights>(html`<urgent-flights></urgent-flights>`);
    
    // Esperamos a que los componentes terminen su render (Lit)
    await el.updateComplete;

    const rows = el.shadowRoot!.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    
    const firstRowText = rows[0].textContent;
    expect(firstRowText).toContain('IB3166');
    expect(firstRowText).toContain('Cancelado');
    
    const secondRowText = rows[1].textContent;
    expect(secondRowText).toContain('VY8024');
    expect(secondRowText).toContain('Retrasado');
    expect(secondRowText).toContain('+45');
  });

  it('debería mostrar mensaje de estado vacío si no hay vuelos urgentes', async () => {
    vi.spyOn(flightService, 'getUrgentFlights').mockResolvedValue([]);
    vi.spyOn(flightService, 'getUpcomingFlights').mockResolvedValue([]);
    const el = await fixture<UrgentFlights>(html`<urgent-flights></urgent-flights>`);
    await el.updateComplete;

    const emptyState = el.shadowRoot!.querySelector('.empty-state');
    expect(emptyState).not.toBeNull();
    expect(emptyState!.textContent).toContain('No hay vuelos para mostrar.');
  });
  it('debería mostrar próximos vuelos si no hay vuelos urgentes', async () => {
    vi.spyOn(flightService, 'getUrgentFlights').mockResolvedValue([]);
    vi.spyOn(flightService, 'getUpcomingFlights').mockResolvedValue([
      {
        flight_status: 'scheduled',
        flight: { iata: 'IB300' },
        airline: { name: 'Iberia' },
        departure: { iata: 'MAD', scheduled: '2026-09-11T12:00:00Z' },
        arrival: { iata: 'BCN' }
      } as any
    ]);

    const el = await fixture<UrgentFlights>(html`<urgent-flights></urgent-flights>`);
    
    // Esperamos a que termine de cargar
    await new Promise(r => setTimeout(r, 0));
    await el.updateComplete;

    // Título debe haber cambiado
    const title = el.shadowRoot!.querySelector('h2');
    expect(title!.textContent).toContain('Próximos Vuelos Programados');

    // Debe mostrar la tabla
    const rows = el.shadowRoot!.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    
    // Debe mostrar la columna Hora
    const firstCell = rows[0].querySelector('td');
    expect(firstCell!.textContent).to.not.be.empty;
  });

});
