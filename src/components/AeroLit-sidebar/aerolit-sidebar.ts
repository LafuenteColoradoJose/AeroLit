import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '@phosphor-icons/webcomponents/PhAirplane';
import '@phosphor-icons/webcomponents/PhChartBar';
import '@phosphor-icons/webcomponents/PhGear';
import '@phosphor-icons/webcomponents/PhMoon';
import '@phosphor-icons/webcomponents/PhSun';
import '@phosphor-icons/webcomponents/PhCaretLeft';
import '@phosphor-icons/webcomponents/PhCaretRight';

@customElement('aerolit-sidebar')
export class AerolitSidebar extends LitElement {

  @state()
  private isOpen = true;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: var(--sidebar-bg);
      color: var(--sidebar-text);
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
      color: var(--sidebar-text);
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
      color: var(--sidebar-text);
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
    .footer {
      margin-top: auto;
      padding: 1rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .theme-toggle-btn {
      background: none;
      border: none;
      color: var(--sidebar-text);
      cursor: pointer;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0.5rem;
      border-radius: 8px;
      transition: background-color 0.2s;
    }

    .theme-toggle-btn:hover {
      background-color: rgba(255,255,255,0.1);
    }

    :host([collapsed]) .theme-text {
      display: none;
    }
    
    ph-chart-bar, ph-airplane, ph-gear, ph-moon, ph-sun, ph-caret-left, ph-caret-right {
      font-size: 1.5rem;
    }
  `;

  @state()
  private currentTheme: 'light' | 'dark' = 'light';

  connectedCallback() {
    super.connectedCallback();
    this.initTheme();
  }

  private initTheme() {
    // 1. Mirar si hay preferencia guardada
    const savedTheme = localStorage.getItem('aerolit-theme') as 'light' | 'dark' | null;
    
    if (savedTheme) {
      this.currentTheme = savedTheme;
    } else {
      // 2. Si no hay guardada, mirar preferencia del SO
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
    }

    this.applyTheme(this.currentTheme);
  }

  private toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('aerolit-theme', this.currentTheme);
    this.applyTheme(this.currentTheme);
  }

  private applyTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.removeAttribute('collapsed');
    } else {
      this.setAttribute('collapsed', '');
    }
  }

  private navigate(e: Event, path: string) {
    e.preventDefault();
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
    
    // Si estamos en móvil (colapsado), podríamos querer cerrarlo, pero por ahora lo dejamos igual.
  }

  render() {
    return html`
      <div class="header">
        <div class="logo">
          <ph-airplane weight="duotone" style="vertical-align: middle; margin-right: 8px;"></ph-airplane> AeroLit
        </div>
        <button class="toggle-btn" @click=${this.toggle} title="Toggle Menu">
          ${this.isOpen 
            ? html`<ph-caret-left weight="duotone"></ph-caret-left>` 
            : html`<ph-caret-right weight="duotone"></ph-caret-right>`}
        </button>
      </div>

      <nav class="nav-links">
        <a class="nav-item" href="/" @click=${(e: Event) => this.navigate(e, '/')}>
          <span class="icon"><ph-chart-bar weight="duotone"></ph-chart-bar></span>
          <span class="text">Dashboard</span>
        </a>
        <a class="nav-item" href="/flights" @click=${(e: Event) => this.navigate(e, '/flights')}>
          <span class="icon"><ph-airplane weight="duotone"></ph-airplane></span>
          <span class="text">Vuelos</span>
        </a>
        <a class="nav-item" href="/settings" @click=${(e: Event) => this.navigate(e, '/settings')}>
          <span class="icon"><ph-gear weight="duotone"></ph-gear></span>
          <span class="text">Ajustes</span>
        </a>
      </nav>

      <div class="footer">
        <button class="theme-toggle-btn" @click=${this.toggleTheme} title="Cambiar Tema">
          <span class="icon">
            ${this.currentTheme === 'light' 
              ? html`<ph-moon weight="duotone"></ph-moon>` 
              : html`<ph-sun weight="duotone"></ph-sun>`}
          </span>
          <span class="text theme-text">${this.currentTheme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aerolit-sidebar': AerolitSidebar;
  }
}
