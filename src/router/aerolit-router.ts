import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Routes } from '@lit-labs/router';

// Importamos todas las vistas que el router va a necesitar
import '../components/AeroLit-dashboard/aerolit-dashboard';

@customElement('aerolit-router')
export class AerolitRouter extends LitElement {
  
  // Aquí centralizamos TODAS las rutas de la aplicación.
  // Este componente SOLO se encarga de enrutar, no tiene estilos ni layouts.
  private _router = new Routes(this, [
    { 
      path: '/', 
      render: () => html`<aerolit-dashboard></aerolit-dashboard>` 
    },
    { 
      path: '/*', 
      render: () => html`<h2 style="color: var(--error-color); padding: 2rem;">Página no encontrada (404)</h2>` 
    }
  ]);

  render() {
    return this._router.outlet();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aerolit-router': AerolitRouter;
  }
}
