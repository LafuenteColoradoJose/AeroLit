import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import { AerolitDashboard } from './aerolit-dashboard';
import { flightService } from '../../services/flight-service';

describe('AerolitDashboard', () => {
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

  it('debería mostrar cargando estadísticas inicialmente y luego pintar los kpis', async () => {
    vi.spyOn(flightService, 'getKpiStats').mockResolvedValue({
      total: 100,
      active: 10,
      cancelled: 2,
      scheduled: 88
    });

    const el = await fixture<AerolitDashboard>(html`<aerolit-dashboard></aerolit-dashboard>`);
    
    // Esperamos actualización
    await el.updateComplete;

    expect(flightService.getKpiStats).toHaveBeenCalled();
    const kpiCards = el.shadowRoot!.querySelectorAll('kpi-card');
    expect(kpiCards.length).toBe(4);
    
    // Verificamos que se pasan los valores correctamente al atributo
    expect(kpiCards[0].getAttribute('value')).toBe('100');
    expect(kpiCards[1].getAttribute('value')).toBe('10');
    expect(kpiCards[2].getAttribute('value')).toBe('88');
    expect(kpiCards[3].getAttribute('value')).toBe('2');
  });

  it('debería mostrar mensaje de error o no romperse si falla getKpiStats', async () => {
    vi.spyOn(flightService, 'getKpiStats').mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const el = await fixture<AerolitDashboard>(html`<aerolit-dashboard></aerolit-dashboard>`);
    await el.updateComplete;

    expect(consoleSpy).toHaveBeenCalledWith('Error loading stats', expect.any(Error));
    const p = el.shadowRoot!.querySelector('p');
    // Debería seguir mostrando el texto de bienvenida
    expect(p?.textContent).toContain('Bienvenido al sistema');
  });
});
