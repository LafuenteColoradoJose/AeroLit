import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import { AerolitSidebar } from './aerolit-sidebar';

describe('AerolitSidebar Component', () => {
  let element: AerolitSidebar;
  let store: Record<string, string> = {};

  beforeEach(async () => {
    // Mock de localStorage
    store = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      clear: vi.fn(() => {
        store = {};
      })
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    // Mock de matchMedia (Simulamos que por defecto el SO está en light)
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

    // Limpiamos el atributo del html antes de cada test
    document.documentElement.removeAttribute('data-theme');

    element = await fixture(html`<aerolit-sidebar></aerolit-sidebar>`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería renderizarse correctamente estando abierto por defecto', () => {
    expect(element).toBeDefined();
    expect(element.hasAttribute('collapsed')).toBe(false);
  });

  it('debería colapsarse al hacer click en el botón de toggle', async () => {
    const toggleBtn = element.shadowRoot?.querySelector('.toggle-btn') as HTMLButtonElement;
    toggleBtn.click();
    await element.updateComplete;
    expect(element.hasAttribute('collapsed')).toBe(true);

    // Y des-colapsarse al hacer click de nuevo
    toggleBtn.click();
    await element.updateComplete;
    expect(element.hasAttribute('collapsed')).toBe(false);
  });

  it('debería leer el tema de localStorage si existe', async () => {
    store['aerolit-theme'] = 'dark';
    const el = await fixture<AerolitSidebar>(html`<aerolit-sidebar></aerolit-sidebar>`);
    await el.updateComplete;
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('debería usar matchMedia si no hay nada en localStorage', async () => {
    // Forzamos matchMedia a true (dark mode)
    window.matchMedia = vi.fn().mockImplementation(() => ({ matches: true }));
    const el = await fixture<AerolitSidebar>(html`<aerolit-sidebar></aerolit-sidebar>`);
    await el.updateComplete;
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('debería cambiar de tema al hacer click en el botón de theme-toggle', async () => {
    // Estado inicial: light
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    const themeBtn = element.shadowRoot?.querySelector('.theme-toggle-btn') as HTMLButtonElement;
    themeBtn.click();
    await element.updateComplete;

    // Después del click: dark
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(store['aerolit-theme']).toBe('dark');

    // Click otra vez: light
    themeBtn.click();
    await element.updateComplete;

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(store['aerolit-theme']).toBe('light');
  });
});
