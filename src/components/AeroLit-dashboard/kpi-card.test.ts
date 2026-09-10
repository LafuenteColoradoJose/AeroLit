import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import { KpiCard } from './kpi-card';

describe('KpiCard', () => {
  it('debería renderizar el título y valor pasados por propiedades', async () => {
    const el = await fixture<KpiCard>(html`
      <kpi-card title="Total Vuelos" value="123"></kpi-card>
    `);
    
    expect(el.shadowRoot!.textContent).toContain('Total Vuelos');
    expect(el.shadowRoot!.textContent).toContain('123');
  });

  it('debería renderizar el slot de icono', async () => {
    const el = await fixture<KpiCard>(html`
      <kpi-card>
        <span slot="icon" class="test-icon">✈️</span>
      </kpi-card>
    `);
    
    const slot = el.shadowRoot!.querySelector('slot[name="icon"]') as HTMLSlotElement;
    expect(slot).not.toBeNull();
    const assignedNodes = slot.assignedNodes({ flatten: true }).filter(n => n.nodeType === Node.ELEMENT_NODE);
    expect(assignedNodes.length).toBeGreaterThan(0);
    expect((assignedNodes[0] as HTMLElement).classList.contains('test-icon')).toBe(true);
  });
});
