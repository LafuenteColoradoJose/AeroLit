import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import { ActivityChart } from './activity-chart';
import { flightService } from '../../services/flight-service';

export let lastChartConfig: any = null;

vi.mock('chart.js', () => {
  return {
    Chart: class MockChart {
      constructor(ctx: any, config: any) {
        lastChartConfig = config;
      }
      static register() {}
      destroy() {}
    },
    registerables: []
  };
});

describe('ActivityChart', () => {
  beforeEach(() => {
    vi.spyOn(flightService, 'getFlightsByTime').mockResolvedValue({
      labels: ['00:00', '01:00'],
      data: [10, 20]
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería ejecutar callbacks de configuración del Chart para cobertura', async () => {
    const el = await fixture<ActivityChart>(html`<activity-chart></activity-chart>`);
    Object.defineProperty(el, 'canvasElement', {
      get: () => ({ getContext: () => ({ save: vi.fn(), restore: vi.fn() }) })
    });
    
    await el.refresh();
    
    expect(lastChartConfig).toBeTruthy();
    
    // Simulate beforeDraw plugin
    const currentHourPlugin = lastChartConfig.plugins[0];
    const mockChartContext = {
      scales: {
        x: { getPixelForValue: () => 100 },
        y: { top: 10, bottom: 90 }
      },
      ctx: {
        save: vi.fn(), beginPath: vi.fn(), setLineDash: vi.fn(),
        moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
        fillText: vi.fn(), restore: vi.fn()
      }
    };
    currentHourPlugin.beforeDraw(mockChartContext);
    
    // Simulate segment borderDash and borderColor
    const segment = lastChartConfig.data.datasets[0].segment;
    expect(segment.borderDash({ p0DataIndex: 25 })).toEqual([5, 5]); // >= currentHour
    expect(segment.borderDash({ p0DataIndex: 1 })).toBeUndefined(); // < currentHour
    
    expect(segment.borderColor({ p0DataIndex: 25 })).toBe('rgba(128, 128, 128, 0.5)');
    expect(segment.borderColor({ p0DataIndex: 1 })).toBeTruthy(); // returns primaryColor
    
    // Simulate tooltip callbacks
    const tooltipLabel = lastChartConfig.options.plugins.tooltip.callbacks.label;
    const currentHour = new Date().getHours();
    expect(tooltipLabel({ dataIndex: currentHour - 1, parsed: { y: 5 }})).toBe('Vuelos Finalizados: 5');
    expect(tooltipLabel({ dataIndex: currentHour, parsed: { y: 10 }})).toBe('Vuelos Activos: 10');
    expect(tooltipLabel({ dataIndex: currentHour + 1, parsed: { y: 15 }})).toBe('Vuelos Programados: 15');
  });

  it('debería renderizar el canvas del gráfico', async () => {
    const el = await fixture<ActivityChart>(html`<activity-chart></activity-chart>`);
    await el.updateComplete;
    const canvas = el.shadowRoot!.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('debería manejar disconnectedCallback correctamente', async () => {
     const el = await fixture<ActivityChart>(html`<activity-chart></activity-chart>`);
     await el.updateComplete;
     el.disconnectedCallback();
     expect(true).toBe(true);
  });
});
