import { describe, it } from 'vitest';
import { html, fixture, expect } from '@open-wc/testing';
import './live-clock';
import { LiveClock } from './live-clock';

describe('LiveClock', () => {
  it('se renderiza correctamente', async () => {
    const el = await fixture<LiveClock>(html`<live-clock></live-clock>`);
    
    // Verificamos elementos del DOM
    const timeDisplay = el.shadowRoot!.querySelector('.time-display');
    const dateDisplay = el.shadowRoot!.querySelector('.date-display');
    
    expect(timeDisplay).to.exist;
    expect(dateDisplay).to.exist;
    
    // El texto no debe estar vacío
    expect(timeDisplay!.textContent?.trim()).to.not.be.empty;
    expect(dateDisplay!.textContent?.trim()).to.not.be.empty;
  });

  it('muestra el indicador de sistema online', async () => {
    const el = await fixture<LiveClock>(html`<live-clock></live-clock>`);
    const indicator = el.shadowRoot!.querySelector('.live-indicator');
    
    expect(indicator).to.exist;
    expect(indicator!.textContent).to.include('Sistema Online');
  });
});
