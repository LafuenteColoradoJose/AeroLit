import { describe, it, expect, beforeEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import { AerolitSidebar } from './aerolit-sidebar';

describe('AerolitSidebar Component', () => {
  let element: AerolitSidebar;

  // Antes de cada test, renderizamos el componente fresco en el "navegador" virtual
  beforeEach(async () => {
    element = await fixture(html`<aerolit-sidebar></aerolit-sidebar>`);
  });

  it('debería renderizarse correctamente estando abierto por defecto', () => {
    // Comprobamos que existe en el DOM
    expect(element).toBeDefined();
    
    // Comprobamos que no tiene el atributo 'collapsed'
    expect(element.hasAttribute('collapsed')).toBe(false);
  });

  it('debería colapsarse al hacer click en el botón de toggle', async () => {
    // 1. Buscamos el botón dentro del Shadow DOM
    const toggleBtn = element.shadowRoot?.querySelector('.toggle-btn') as HTMLButtonElement;
    expect(toggleBtn).toBeDefined();

    // 2. Simulamos el click
    toggleBtn.click();

    // 3. Esperamos a que Lit actualice el DOM asíncronamente
    await element.updateComplete;

    // 4. Verificamos que ahora sí tiene el atributo 'collapsed'
    expect(element.hasAttribute('collapsed')).toBe(true);
  });
});
