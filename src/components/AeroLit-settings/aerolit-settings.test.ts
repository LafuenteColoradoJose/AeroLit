import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import './aerolit-settings';
import type { AerolitSettings } from './aerolit-settings';

describe('AerolitSettings Component', () => {
  it('debería renderizar los ajustes básicos', async () => {
    const el = await fixture<AerolitSettings>(html`<aerolit-settings></aerolit-settings>`);
    await el.updateComplete;

    expect(el.shadowRoot!.textContent).toContain('Ajustes');
    expect(el.shadowRoot!.textContent).toContain('Configuración de la aplicación');
  });
});
