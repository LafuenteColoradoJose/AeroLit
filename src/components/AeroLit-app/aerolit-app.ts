import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

// Importamos los componentes hermanos que vamos a inyectar
import '../AeroLit-sidebar/aerolit-sidebar';
import '../../router/aerolit-router';

@customElement('aerolit-app')
export class AerolitApp extends LitElement {

  static styles = css`
    :host {
      display: flex;
      flex-direction: row;
      min-height: 100vh;
      width: 100%;
      box-sizing: border-box;
      background-color: var(--bg-color);
      margin: 0;
      padding: 0;
      overflow: hidden; /* Evita scroll global, el main tendrá su propio scroll */
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    main {
      flex: 1;
      height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      background-color: var(--bg-color);
      box-sizing: border-box;
    }

    @media (max-width: 768px) {
      :host {
        flex-direction: column-reverse; /* Sidebar abajo como tab-bar */
      }
      main {
        height: calc(100vh - 65px); /* Restamos la altura del sidebar en móvil */
      }
    }
  `;

  render() {
    return html`
      <!-- 1. Inyectamos el componente aislado del Sidebar -->
      <aerolit-sidebar role="navigation" aria-label="Navegación principal"></aerolit-sidebar>

      <!-- 2. Inyectamos el componente aislado del Router en el main -->
      <main role="main">
        <aerolit-router></aerolit-router>
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aerolit-app': AerolitApp;
  }
}
