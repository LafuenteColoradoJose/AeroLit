import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Routes } from '@lit-labs/router';

// Importamos todas las vistas que el router va a necesitar
import '../components/AeroLit-dashboard/aerolit-dashboard.ts';
import '../components/AeroLit-flights/aerolit-flights.ts';
import '../components/AeroLit-settings/aerolit-settings.ts';
import '../components/AeroLit-radar/aerolit-radar.ts';

@customElement('aerolit-router')
export class AerolitRouter extends LitElement {
  
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;
  private _router = new Routes(this, [
    { 
      path: '/', 
      render: () => html`<aerolit-dashboard></aerolit-dashboard>` 
    },
    { 
      path: '/flights', 
      render: () => html`<aerolit-flights></aerolit-flights>` 
    },
    { 
      path: '/radar', 
      render: () => html`<aerolit-radar></aerolit-radar>` 
    },
    { 
      path: '/settings', 
      render: () => html`<aerolit-settings></aerolit-settings>` 
    },
    { 
      path: '/*', 
      render: () => html`<h2 style="color: var(--error-color); padding: 2rem;">Página no encontrada (404)</h2>` 
    }
  ]);

  connectedCallback() {
    super.connectedCallback();
    // Forzamos al router a evaluar la URL actual al cargar la página.
    this._router.goto(window.location.pathname);
    
    // Escuchamos eventos de popstate explícitamente para asegurar la reacción a los cambios de historial del sidebar
    window.addEventListener('popstate', () => {
      this._router.goto(window.location.pathname);
    });
  }

  render() {
    return this._router.outlet();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aerolit-router': AerolitRouter;
  }
}
