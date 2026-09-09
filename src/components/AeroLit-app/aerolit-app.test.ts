import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import { AerolitApp } from './aerolit-app';

describe('AerolitApp Component', () => {
  let element: AerolitApp;

  beforeEach(async () => {
    // Mock global para jsdom que no implementa matchMedia
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

    element = await fixture(html`<aerolit-app></aerolit-app>`);
  });

  it('debería renderizar el sidebar y el main contenedor', () => {
    expect(element).toBeDefined();
    
    // Verificamos que el sidebar está inyectado
    const sidebar = element.shadowRoot?.querySelector('aerolit-sidebar');
    expect(sidebar).toBeDefined();

    // Verificamos que el main y el router están inyectados
    const main = element.shadowRoot?.querySelector('main');
    expect(main).toBeDefined();
    
    const router = element.shadowRoot?.querySelector('aerolit-router');
    expect(router).toBeDefined();
  });
});
