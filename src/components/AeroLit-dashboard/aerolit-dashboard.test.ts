import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import { AerolitDashboard } from './aerolit-dashboard';

describe('AerolitDashboard Component', () => {
  let element: AerolitDashboard;

  const mockData = {
    data: [
      {
        flight_status: 'active',
        departure: { iata: 'MAD', airport: 'Adolfo Suarez' },
        arrival: { iata: 'BCN', airport: 'El Prat' },
        airline: { name: 'Iberia' },
        flight: { iata: 'IB1234' }
      },
      {
        flight_status: 'cancelled',
        departure: { iata: 'JFK', airport: 'John F Kennedy' },
        arrival: { iata: 'LHR', airport: 'Heathrow' },
        airline: { name: 'British Airways' },
        flight: { iata: 'BA456' }
      }
    ]
  };

  beforeEach(async () => {
    // Mock global fetch
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    element = await fixture(html`<aerolit-dashboard></aerolit-dashboard>`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería mostrar estado de carga inicialmente', async () => {
    // Necesitamos instanciarlo fresco y ver el estado de carga antes de que el fetch termine
    const el = document.createElement('aerolit-dashboard') as AerolitDashboard;
    
    // Sobrescribimos el fetch para que no se resuelva inmediatamente
    globalThis.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));
    
    document.body.appendChild(el);
    await el.updateComplete;
    
    const loading = el.shadowRoot?.querySelector('.loading');
    expect(loading).toBeDefined();
    expect(loading?.textContent).toContain('Buscando vuelos');
    
    document.body.removeChild(el);
  });

  it('debería renderizar tarjetas de vuelos cuando el fetch tiene éxito', async () => {
    // Ya ha hecho fetch en el beforeEach
    await element.updateComplete;

    const cards = element.shadowRoot?.querySelectorAll('flight-card');
    expect(cards?.length).toBe(2);
  });

  it('debería mostrar error si fetch devuelve not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
    } as Response);

    const el = await fixture<AerolitDashboard>(html`<aerolit-dashboard></aerolit-dashboard>`);
    await el.updateComplete;

    const error = el.shadowRoot?.querySelector('.error');
    expect(error).toBeDefined();
    expect(error?.textContent).toContain('Error al cargar los vuelos');
  });

  it('debería mostrar error si el JSON contiene error de API', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: { message: 'API key inválida' } }),
    } as Response);

    const el = await fixture<AerolitDashboard>(html`<aerolit-dashboard></aerolit-dashboard>`);
    await el.updateComplete;

    const error = el.shadowRoot?.querySelector('.error');
    expect(error?.textContent).toContain('API key inválida');
  });

  it('debería manejar errores de red (catch)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const el = await fixture<AerolitDashboard>(html`<aerolit-dashboard></aerolit-dashboard>`);
    await el.updateComplete;

    const error = el.shadowRoot?.querySelector('.error');
    expect(error?.textContent).toContain('Network error');
  });
});
