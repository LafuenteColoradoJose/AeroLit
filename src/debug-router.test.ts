import { describe, it, expect } from 'vitest';
import { Routes } from '@lit-labs/router';
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fixture } from '@open-wc/testing';

import './router/aerolit-router.ts';

describe('Test Router', () => {
  it('should render flights', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/flights', search: '', hash: '' },
      writable: true
    });
    
    const element = await fixture(html`<aerolit-router></aerolit-router>`);
    await element.updateComplete;
    console.log("HTML on mount:", element.shadowRoot?.innerHTML);
  });
});
