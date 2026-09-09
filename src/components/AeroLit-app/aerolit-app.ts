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
      min-height: 100vh;
      width: 100vw;
      background-color: var(--bg-color);
      margin: 0;
      padding: 0;
      overflow: hidden; /* Evita scroll global, el main tendrá su propio scroll */
    }

    main {
      flex: 1;
      height: 100vh;
      overflow-y: auto;
      background-color: var(--bg-color);
    }
  `;

  render() {
    return html`
      <!-- 1. Inyectamos el componente aislado del Sidebar -->
      <aerolit-sidebar></aerolit-sidebar>

      <!-- 2. Inyectamos el componente aislado del Router en el main -->
      <main>
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
