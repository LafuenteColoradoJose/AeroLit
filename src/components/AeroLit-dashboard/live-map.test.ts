import { fixture, html } from '@open-wc/testing';
import { expect, vi, describe, it, beforeEach, afterEach } from 'vitest';
import { flightService } from '../../services/flight-service';
import './live-map';
import type { LiveMap } from './live-map';
import type { Flight } from '../../models/flight';

describe('LiveMap', () => {
  const mockActiveFlights: Flight[] = [
    {
      flight_date: "2023-10-27",
      flight_status: "active",
      departure: { airport: "Madrid", timezone: "Europe/Madrid", iata: "MAD", icao: "LEMD", terminal: "4", gate: "H12", delay: null, scheduled: "2023-10-27T10:00:00+00:00", estimated: null, actual: null, estimated_runway: null, actual_runway: null },
      arrival: { airport: "New York", timezone: "America/New_York", iata: "JFK", icao: "KJFK", terminal: "8", gate: "B", delay: null, scheduled: "2023-10-27T12:00:00+00:00", estimated: null, actual: null, estimated_runway: null, actual_runway: null },
      airline: { name: "Iberia", iata: "IB", icao: "IBE" },
      flight: { number: "6123", iata: "IB6123", icao: "IBE6123", codeshared: null },
      live: {
        updated: "2023-10-27T11:00:00+00:00",
        latitude: 42.0,
        longitude: -30.0,
        altitude: 35000,
        direction: 280,
        speed_horizontal: 850,
        speed_vertical: 0,
        is_ground: false
      }
    }
  ];

  beforeEach(() => {
    vi.spyOn(flightService, 'getFlights').mockResolvedValue(mockActiveFlights);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería renderizar el contenedor del mapa', async () => {
    const el = await fixture<LiveMap>(html`<live-map></live-map>`);
    await el.updateComplete;

    // Verificar que el map renderiza un div con id "map"
    const mapDiv = el.shadowRoot!.querySelector('#map');
    expect(mapDiv).not.toBeNull();
  });

  it('debería mostrar mensaje de carga inicialmente si tarda', async () => {
    // Retrasar artificialmente la promesa
    vi.spyOn(flightService, 'getFlights').mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    const el = await fixture<LiveMap>(html`<live-map></live-map>`);
    // En el primer render (antes de resolve), debería mostrar 'Cargando mapa...'
    const emptyState = el.shadowRoot!.querySelector('.empty-state');
    expect(emptyState).not.toBeNull();
    expect(emptyState!.textContent).toContain('Cargando mapa...');
  });
});
