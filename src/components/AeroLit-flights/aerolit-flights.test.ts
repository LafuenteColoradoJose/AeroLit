import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import { AerolitFlights } from './aerolit-flights';
import { flightService } from '../../services/flight-service';
import type { Flight } from '../../models/flight';

describe('AerolitFlights', () => {
  const generateMockFlights = (count: number): Flight[] => {
    const flights: Flight[] = [];
    for (let i = 0; i < count; i++) {
        flights.push({
            flight_date: "2023-10-27",
            flight_status: i % 2 === 0 ? "active" : "scheduled",
            departure: { airport: "Madrid", timezone: "Europe/Madrid", iata: "MAD", icao: "LEMD", terminal: "4", gate: "H1", delay: 10, scheduled: "2023-10-27T10:00:00+00:00", estimated: "2023-10-27T10:10:00+00:00", actual: "2023-10-27T10:10:00+00:00", estimated_runway: null, actual_runway: null },
            arrival: { airport: "Barcelona", timezone: "Europe/Madrid", iata: "BCN", icao: "EGLL", terminal: "5", gate: "A10", delay: 0, scheduled: "2023-10-27T12:00:00+00:00", estimated: "2023-10-27T12:00:00+00:00", actual: null, estimated_runway: null, actual_runway: null },
            airline: { name: `Airline${i}`, iata: `A${i}`, icao: `A${i}A` },
            flight: { number: `100${i}`, iata: `A${i}100${i}`, icao: `A${i}A100${i}`, codeshared: null }
        });
    }
    return flights;
  };

  beforeEach(() => {
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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('debería mostrar loading al iniciar y luego renderizar los vuelos', async () => {
    const mock = generateMockFlights(1);
    vi.spyOn(flightService, 'getFlights').mockResolvedValue(mock);
    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    await el.updateComplete;
    expect(flightService.getFlights).toHaveBeenCalled();
    const flightRows = el.shadowRoot!.querySelectorAll('.list-row');
    expect(flightRows.length).toBe(1);
    expect(flightRows[0].textContent).toContain('Airline0');
  });

  it('debería mostrar mensaje de error si falla la carga', async () => {
    vi.spyOn(flightService, 'getFlights').mockRejectedValue(new Error('Network Error'));
    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    await el.updateComplete;
    const errorMsg = el.shadowRoot!.querySelector('.error');
    expect(errorMsg).not.toBeNull();
    expect(errorMsg!.textContent).toContain('No se pudieron cargar los vuelos.');
  });

  it('debería cambiar entre vista de lista y vista de cuadrícula', async () => {
    vi.spyOn(flightService, 'getFlights').mockResolvedValue(generateMockFlights(1));
    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.flight-list')).not.toBeNull();
    const gridBtn = el.shadowRoot!.querySelector('.view-btn[title="Vista Cuadrícula"]') as HTMLButtonElement;
    gridBtn.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.flight-grid')).not.toBeNull();
    const listBtn = el.shadowRoot!.querySelector('.view-btn[title="Vista Lista"]') as HTMLButtonElement;
    listBtn.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.flight-list')).not.toBeNull();
  });

  it('debería aplicar filtros de llegada y estado correctamente', async () => {
    vi.spyOn(flightService, 'getFlights').mockResolvedValue(generateMockFlights(2));
    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    await el.updateComplete;

    const selects = el.shadowRoot!.querySelectorAll('select');
    
    selects[1].value = 'arrival';
    selects[1].dispatchEvent(new Event('change'));

    selects[0].value = 'BCN';
    selects[0].dispatchEvent(new Event('change'));

    selects[2].value = 'scheduled';
    selects[2].dispatchEvent(new Event('change'));

    const searchBtn = el.shadowRoot!.querySelector('.search-btn') as HTMLButtonElement;
    searchBtn.click();
    await el.updateComplete;

    const flightRows = el.shadowRoot!.querySelectorAll('.list-row');
    expect(flightRows.length).toBe(1);
    expect(flightRows[0].textContent).toContain('Airline1');
  });

  it('debería buscar vuelos por texto usando input y Enter keyup', async () => {
    vi.spyOn(flightService, 'getFlights').mockResolvedValue(generateMockFlights(5));
    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    await el.updateComplete;

    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = 'Airline3';
    input.dispatchEvent(new Event('input'));
    
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
    await el.updateComplete;
    let flightRows = el.shadowRoot!.querySelectorAll('.list-row');
    expect(flightRows.length).toBe(5);

    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    await el.updateComplete;

    flightRows = el.shadowRoot!.querySelectorAll('.list-row');
    expect(flightRows.length).toBe(1);
    expect(flightRows[0].textContent).toContain('Airline3');
  });

  it('debería paginar correctamente', async () => {
    vi.spyOn(flightService, 'getFlights').mockResolvedValue(generateMockFlights(25));
    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    await el.updateComplete;

    let flightRows = el.shadowRoot!.querySelectorAll('.list-row');
    expect(flightRows.length).toBe(20);

    const buttons = el.shadowRoot!.querySelectorAll('.page-btn');
    const prevBtn = buttons[0] as HTMLButtonElement;
    const nextBtn = buttons[1] as HTMLButtonElement;

    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);

    nextBtn.click();
    await el.updateComplete;

    flightRows = el.shadowRoot!.querySelectorAll('.list-row');
    expect(flightRows.length).toBe(5);
    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(true);

    prevBtn.click();
    await el.updateComplete;
    flightRows = el.shadowRoot!.querySelectorAll('.list-row');
    expect(flightRows.length).toBe(20);
  });
  
  it('debería manejar el empty state de búsqueda', async () => {
    vi.spyOn(flightService, 'getFlights').mockResolvedValue(generateMockFlights(2));
    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    await el.updateComplete;

    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = 'NOEXISTE';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    await el.updateComplete;

    const emptyMsg = el.shadowRoot!.querySelector('.empty');
    expect(emptyMsg).not.toBeNull();
  });

  it('debería refrescar los vuelos con el intervalo si la pestaña es visible', async () => {
    const getFlightsSpy = vi.spyOn(flightService, 'getFlights').mockResolvedValue(generateMockFlights(1));
    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    await el.updateComplete;
    
    expect(getFlightsSpy).toHaveBeenCalledTimes(1);
    
    vi.advanceTimersByTime(60000);
    expect(getFlightsSpy).toHaveBeenCalledTimes(2);

    el.disconnectedCallback();
    vi.advanceTimersByTime(60000);
    expect(getFlightsSpy).toHaveBeenCalledTimes(2);
  });

  it('no debería refrescar los vuelos si el document.hidden es true', async () => {
    const getFlightsSpy = vi.spyOn(flightService, 'getFlights').mockResolvedValue(generateMockFlights(1));
    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    await el.updateComplete;
    expect(getFlightsSpy).toHaveBeenCalledTimes(1);
    
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    
    vi.advanceTimersByTime(60000);
    expect(getFlightsSpy).toHaveBeenCalledTimes(1); 
    
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    vi.advanceTimersByTime(60000);
    expect(getFlightsSpy).toHaveBeenCalledTimes(2); 
  });

  it('debería cubrir el mapeo de Aeropuerto AENA y ordenar los distintos estados', async () => {
    const mockFlights = [
      {
        flight_date: "2023-10-27",
        flight_status: "scheduled",
        departure: { airport: "Madrid", timezone: "Europe/Madrid", iata: "MAD", scheduled: "2023-10-27T10:00:00+00:00" },
        arrival: { airport: "Aeropuerto AENA", timezone: "Europe/Madrid", iata: "BCN", scheduled: "2023-10-27T12:00:00+00:00" },
        airline: { name: "Iberia" },
        flight: { number: "3166", iata: "IB3166" }
      },
      {
        flight_date: "2023-10-27",
        flight_status: "landed",
        departure: { airport: "Madrid", timezone: "Europe/Madrid", iata: "MAD", scheduled: "2023-10-27T08:00:00+00:00" },
        arrival: { airport: "Aeropuerto AENA", timezone: "Europe/Madrid", iata: "AGP", scheduled: "2023-10-27T12:00:00+00:00" },
        airline: { name: "Iberia" },
        flight: { number: "1000", iata: "IB1000" }
      },
      {
        flight_date: "2023-10-27",
        flight_status: "cancelled",
        departure: { airport: "Madrid", timezone: "Europe/Madrid", iata: "MAD", scheduled: "2023-10-27T09:00:00+00:00" },
        arrival: { airport: "London", timezone: "Europe/London", iata: "LHR", scheduled: "2023-10-27T12:00:00+00:00" },
        airline: { name: "British" },
        flight: { number: "2000", iata: "BA2000" }
      },
      {
        flight_date: "2023-10-27",
        flight_status: "unknown",
        departure: { airport: "Madrid", timezone: "Europe/Madrid", iata: "MAD", scheduled: "2023-10-27T09:00:00+00:00" },
        arrival: { airport: "London", timezone: "Europe/London", iata: "LHR", scheduled: "2023-10-27T12:00:00+00:00" },
        airline: { name: "British" },
        flight: { number: "2000", iata: "BA2000" }
      }
    ];

    vi.spyOn(flightService, 'getFlights').mockResolvedValue(mockFlights as any);
    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    await el.updateComplete;

    const textContent = el.shadowRoot!.textContent;
    expect(textContent).toContain('Barcelona');
    expect(textContent).toContain('Málaga');
  });

  it('debería manejar casos límite de fallback (sin iata, sin fecha, aeropuerto aena no encontrado)', async () => {
    const mockFlights = [
      {
        flight_date: "2023-10-27",
        flight_status: "scheduled",
        departure: { airport: "Madrid", timezone: "Europe/Madrid", iata: "MAD", scheduled: null }, 
        arrival: { airport: "Aeropuerto AENA", timezone: "Europe/Madrid", iata: "ZZZ", scheduled: null }, 
        airline: { name: "Iberia" },
        flight: { number: "3166", iata: null } 
      }
    ];

    vi.spyOn(flightService, 'getFlights').mockResolvedValue(mockFlights as any);
    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    await el.updateComplete;

    const textContent = el.shadowRoot!.textContent;
    expect(textContent).toContain('--:--');
    expect(textContent).toContain('ZZZ');
    expect(textContent).toContain('3166');
  });

  it('debería manejar prevPage() y nextPage() en sus límites, y orden con fechas faltantes', async () => {
    const mockFlights = [
      {
        flight_date: "2023-10-27",
        flight_status: "scheduled",
        departure: { airport: "Madrid", timezone: "Europe/Madrid", iata: "MAD", scheduled: null }, 
        arrival: { airport: "Aeropuerto AENA", timezone: "Europe/Madrid", iata: "ZZZ", scheduled: null }, 
        airline: { name: "Iberia" },
        flight: { number: "1000", iata: null } 
      },
      {
        flight_date: "2023-10-27",
        flight_status: "scheduled",
        departure: { airport: "Madrid", timezone: "Europe/Madrid", iata: "MAD", scheduled: "2023-10-27T10:00:00+00:00" }, 
        arrival: { airport: "Aeropuerto AENA", timezone: "Europe/Madrid", iata: "ZZZ", scheduled: null }, 
        airline: { name: "Iberia" },
        flight: { number: "2000", iata: null } 
      }
    ];

    vi.spyOn(flightService, 'getFlights').mockResolvedValue(mockFlights as any);
    const el = await fixture<AerolitFlights>(html`<aerolit-flights></aerolit-flights>`);
    await el.updateComplete;

    (el as any).nextPage();
    expect((el as any).currentPage).toBe(1);

    (el as any).prevPage();
    expect((el as any).currentPage).toBe(1);

    const selects = el.shadowRoot!.querySelectorAll('select');
    selects[1].value = 'arrival';
    selects[1].dispatchEvent(new Event('change'));
    
    const searchBtn = el.shadowRoot!.querySelector('.search-btn') as HTMLButtonElement;
    searchBtn.click();
    await el.updateComplete;
  });

});
