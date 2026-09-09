import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('aerolit-sidebar')
export class AerolitSidebar extends LitElement {

  @state()
  private isOpen = true;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: var(--primary-color); /* Dark Teal */
      color: var(--bg-color); /* Almond Silk */
      transition: width 0.3s ease;
      overflow-x: hidden;
      width: 250px;
      border-right: 2px solid var(--secondary-color);
    }

    :host([collapsed]) {
      width: 70px;
    }

    .header {
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--secondary-color);
      white-space: nowrap;
    }

    .toggle-btn {
      background: none;
      border: none;
      color: var(--bg-color);
      cursor: pointer;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-btn:hover {
      color: var(--secondary-color);
    }

    .nav-links {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1rem 0;
      gap: 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      color: var(--bg-color);
      text-decoration: none;
      transition: background-color 0.2s;
      cursor: pointer;
      white-space: nowrap;
    }

    .nav-item:hover {
      background-color: rgba(255,255,255,0.1);
      border-left: 4px solid var(--secondary-color);
    }

    .icon {
      font-size: 1.2rem;
      min-width: 40px;
      text-align: center;
    }

    .text {
      margin-left: 10px;
    }
    
    /* Ocultar texto si está colapsado */
    :host([collapsed]) .text, 
    :host([collapsed]) .logo {
      display: none;
    }
  `;

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.removeAttribute('collapsed');
    } else {
      this.setAttribute('collapsed', '');
    }
  }

  render() {
    return html`
      <div class="header">
        <div class="logo">✈️ AeroLit</div>
        <button class="toggle-btn" @click=${this.toggle} title="Toggle Menu">
          ${this.isOpen ? '◀' : '▶'}
        </button>
      </div>

      <nav class="nav-links">
        <a class="nav-item" href="/">
          <span class="icon">📊</span>
          <span class="text">Dashboard</span>
        </a>
        <a class="nav-item" href="/flights">
          <span class="icon">🛫</span>
          <span class="text">Vuelos</span>
        </a>
        <a class="nav-item" href="/settings">
          <span class="icon">⚙️</span>
          <span class="text">Ajustes</span>
        </a>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aerolit-sidebar': AerolitSidebar;
  }
}
