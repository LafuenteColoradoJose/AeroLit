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
    vi.spyOn(flightService, 'getUrgentFlights').mockResolvedValue([]);
    vi.spyOn(flightService, 'getFlightsByTime').mockResolvedValue({ labels: [], data: [] });
    vi.spyOn(flightService, 'getFlights').mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería mostrar cargando estadísticas inicialmente y luego pintar los kpis', async () => {
    vi.spyOn(flightService, 'getKpiStats').mockResolvedValue({
      total: 100,
      active: 10,
      cancelled: 2,
      scheduled: 88,
      landed: 15,
      activeTrend: '2',
      scheduledTrend: '1'
    });

    const el = await fixture<AerolitDashboard>(html`<aerolit-dashboard></aerolit-dashboard>`);
    
    await el.updateComplete;

    const kpiCards = el.shadowRoot!.querySelectorAll('kpi-card');
    expect(kpiCards.length).toBe(4);
    
    expect(kpiCards[0].getAttribute('value')).toBe('100');
    expect(kpiCards[1].getAttribute('value')).toBe('10');
    expect(kpiCards[2].getAttribute('value')).toBe('2');
    expect(kpiCards[3].getAttribute('value')).toBe('15');
  });

  it('debería mostrar mensaje de error o no romperse si falla getKpiStats', async () => {
    vi.spyOn(flightService, 'getKpiStats').mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const el = await fixture<AerolitDashboard>(html`<aerolit-dashboard></aerolit-dashboard>`);
    await el.updateComplete;

    expect(consoleSpy).toHaveBeenCalledWith('Error loading stats', expect.any(Error));
    const p = el.shadowRoot!.querySelector('p');
    expect(p?.textContent).toContain('Bienvenido al sistema');
  });

  it('debería manejar disconnectedCallback correctamente', async () => {
    const el = await fixture<AerolitDashboard>(html`<aerolit-dashboard></aerolit-dashboard>`);
    await el.updateComplete;
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    el.disconnectedCallback();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('debería ejecutar uiTickInterval para refrescar los datos', async () => {
    vi.useFakeTimers();
    vi.spyOn(flightService, 'getKpiStats').mockResolvedValue({
      total: 100,
      active: 10,
      cancelled: 2,
      scheduled: 88,
      landed: 15,
      activeTrend: '2',
      scheduledTrend: '1'
    });
    const el = await fixture<AerolitDashboard>(html`<aerolit-dashboard></aerolit-dashboard>`);
    await el.updateComplete;
    
    // Avanzar el tiempo 60 segundos
    vi.advanceTimersByTime(60000);
    
    expect(flightService.getKpiStats).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
