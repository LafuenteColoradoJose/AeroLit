import { fixture, html } from '@open-wc/testing';
import { expect, vi, describe, it, beforeEach, afterEach } from 'vitest';
import { flightService } from '../../services/flight-service';
import './aerolit-radar';
import type { AerolitRadar } from './aerolit-radar';

/** Posición de aeronave simulada para los tests del radar. */
const mockPlane = {
  callsign: 'IB123',
  country: 'Spain',
  altitude: 35000,
  velocity: 800,
  latitude: 40,
  longitude: -3,
  direction: 90,
};

/**
 * Espera a que Lit procese la carga asíncrona inicial del componente.
 *
 * @param {AerolitRadar} el - Instancia del radar.
 * @returns {Promise<void>} Promesa que resuelve tras el refresco del DOM.
 */
const flush = async (el: AerolitRadar) => {
  await new Promise(resolve => setTimeout(resolve, 0));
  await el.updateComplete;
};

describe('AerolitRadar', () => {
  let resizeCallback: (() => void) | null = null;

  beforeEach(() => {
    resizeCallback = null;
    // Mock ResizeObserver que conserva el callback para poder invocarlo en los tests.
    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = () => callback([], this as unknown as ResizeObserver);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    vi.spyOn(flightService, 'getLivePlanes').mockResolvedValue([mockPlane]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería renderizar el contenedor del mapa', async () => {
    const el = await fixture<AerolitRadar>(html`<aerolit-radar></aerolit-radar>`);
    await el.updateComplete;

    // Verificar que el map renderiza un div con id "map"
    const mapDiv = el.shadowRoot!.querySelector('#map');
    expect(mapDiv).not.toBeNull();
  });

  it('debería mostrar mensaje de carga inicialmente si tarda', async () => {
    // Retrasar artificialmente la promesa
    vi.spyOn(flightService, 'getLivePlanes').mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100)),
    );

    const el = await fixture<AerolitRadar>(html`<aerolit-radar></aerolit-radar>`);
    // En el primer render (antes de resolve), debería mostrar 'Cargando radar...'
    const emptyState = el.shadowRoot!.querySelector('.empty-state');
    expect(emptyState).not.toBeNull();
    expect(emptyState!.textContent).toContain('Cargando radar...');
  });

  it('debería dibujar los aviones y mostrar el contador actualizado', async () => {
    const el = await fixture<AerolitRadar>(html`<aerolit-radar></aerolit-radar>`);
    await flush(el);

    expect((el as any).markers).toHaveLength(1);
    const status = el.shadowRoot!.querySelector('.radar-status');
    expect(status).not.toBeNull();
    expect(status!.textContent).toContain('1 aeronave');
    expect(el.shadowRoot!.querySelector('.empty-state')).toBeNull();
  });

  it('debería mostrar el estado vacío cuando no hay aeronaves', async () => {
    vi.spyOn(flightService, 'getLivePlanes').mockResolvedValue([]);

    const el = await fixture<AerolitRadar>(html`<aerolit-radar></aerolit-radar>`);
    await flush(el);

    const emptyState = el.shadowRoot!.querySelector('.empty-state');
    expect(emptyState).not.toBeNull();
    expect(emptyState!.textContent).toContain('No hay aeronaves disponibles');
  });

  it('debería mostrar un aviso de error y recuperarse al reintentar', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (flightService.getLivePlanes as any).mockRejectedValue(new Error('radar caído'));

    const el = await fixture<AerolitRadar>(html`<aerolit-radar></aerolit-radar>`);
    await flush(el);

    const alert = el.shadowRoot!.querySelector('.radar-alert');
    expect(alert).not.toBeNull();
    expect(alert!.textContent).toContain('No se ha podido conectar');

    (flightService.getLivePlanes as any).mockResolvedValue([mockPlane]);
    const button = el.shadowRoot!.querySelector('.radar-alert button') as HTMLButtonElement;
    button.click();
    await flush(el);

    expect(el.shadowRoot!.querySelector('.radar-alert')).toBeNull();
    expect(el.shadowRoot!.querySelector('.radar-status')!.textContent).toContain('1 aeronave');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('no debería mostrar el overlay de carga en refrescos posteriores', async () => {
    const el = await fixture<AerolitRadar>(html`<aerolit-radar></aerolit-radar>`);
    await flush(el);

    await (el as any).loadFlights(false);
    await el.updateComplete;

    expect((el as any).loading).toBe(false);
    expect(el.shadowRoot!.querySelector('.empty-state')).toBeNull();
  });

  it('debería ignorar aviones sin coordenadas válidas', async () => {
    const el = await fixture<AerolitRadar>(html`<aerolit-radar></aerolit-radar>`);
    await flush(el);

    const before = (el as any).markers.length;
    (el as any).addPlaneToMap({ latitude: NaN, longitude: -3, callsign: 'INVALID' });

    expect((el as any).markers).toHaveLength(before);
  });

  it('debería asignar color amarillo a altitudes inválidas y escapar HTML', async () => {
    const el = await fixture<AerolitRadar>(html`<aerolit-radar></aerolit-radar>`);
    await el.updateComplete;

    expect((el as any).getPlaneColor(NaN)).toBe('#facc15');
    expect((el as any).escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    );
  });

  it('debería cubrir todos los rangos de altitud y valores ausentes', async () => {
    const el = await fixture<AerolitRadar>(html`<aerolit-radar></aerolit-radar>`);
    await flush(el);

    expect((el as any).getPlaneColor(10000)).toBe('#4ade80');
    expect((el as any).getPlaneColor(20000)).toBe('#38bdf8');
    expect((el as any).getPlaneColor(30000)).toBe('#3b82f6');
    expect((el as any).getPlaneColor(40000)).toBe('#a855f7');

    // Sin mapa no debe intentar crear marcadores.
    const originalMap = (el as any).map;
    (el as any).map = null;
    expect(() => (el as any).addPlaneToMap({ latitude: 40, longitude: -3 })).not.toThrow();
    (el as any).map = originalMap;

    // Aeronave sin dirección, altitud, velocidad, callsign ni país.
    const markersBefore = (el as any).markers.length;
    (el as any).addPlaneToMap({ latitude: 40, longitude: -3 });
    expect((el as any).markers.length).toBe(markersBefore + 1);
  });

  it('debería recalcular el mapa al redimensionar y refrescar cada minuto si la pestaña está visible', async () => {
    let intervalCallback: (() => void) | null = null;
    const setIntervalSpy = vi.spyOn(window, 'setInterval').mockImplementation(((
      callback: () => void,
    ) => {
      intervalCallback = callback;
      return 1 as any;
    }) as any);

    const el = await fixture<AerolitRadar>(html`<aerolit-radar></aerolit-radar>`);
    await flush(el);

    // Callback del ResizeObserver sin mapa y con mapa.
    expect(resizeCallback).not.toBeNull();
    const originalMap = (el as any).map;
    (el as any).map = null;
    expect(() => resizeCallback!()).not.toThrow();

    const invalidateSpy = vi.fn();
    (el as any).map = { invalidateSize: invalidateSpy };
    resizeCallback!();
    expect(invalidateSpy).toHaveBeenCalled();
    (el as any).map = originalMap;

    // El intervalo solo refresca cuando la pestaña está visible.
    expect(intervalCallback).not.toBeNull();
    const getLivePlanesSpy = flightService.getLivePlanes as any;
    const callsBefore = getLivePlanesSpy.mock.calls.length;

    intervalCallback!();
    expect(getLivePlanesSpy.mock.calls.length).toBe(callsBefore + 1);

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    intervalCallback!();
    expect(getLivePlanesSpy.mock.calls.length).toBe(callsBefore + 1);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });

    setIntervalSpy.mockRestore();
  });

  it('debería manejar disconnectedCallback correctamente', async () => {
    const el = await fixture<AerolitRadar>(html`<aerolit-radar></aerolit-radar>`);

    // Asignar los valores dummy *después* de updateComplete para que no los sobreescriba initMap
    await el.updateComplete;

    const removeSpy = vi.fn();
    const disconnectSpy = vi.fn();

    (el as any).map = { remove: removeSpy } as any;
    (el as any).resizeObserver = { disconnect: disconnectSpy, observe: vi.fn() } as any;
    (el as any).updateInterval = 123;

    el.disconnectedCallback();

    expect(removeSpy).toHaveBeenCalled();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});
