import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '@phosphor-icons/webcomponents/PhAirplane';
import '@phosphor-icons/webcomponents/PhChartBar';
import '@phosphor-icons/webcomponents/PhGear';
import '@phosphor-icons/webcomponents/PhMoon';
import '@phosphor-icons/webcomponents/PhSun';
import '@phosphor-icons/webcomponents/PhCaretLeft';
import '@phosphor-icons/webcomponents/PhCaretRight';
import '@phosphor-icons/webcomponents/PhGlobeHemisphereWest';

@customElement('aerolit-sidebar')
export class AerolitSidebar extends LitElement {

  @state()
  private isOpen = false;

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
    :host([collapsed]) .logo-text {
      display: none;
    }
    :host([collapsed]) .header {
      justify-content: center;
    }
    :host([collapsed]) .logo ph-airplane {
      margin-right: 0 !important;
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
    
    ph-chart-bar, ph-airplane, ph-gear, ph-moon, ph-sun, ph-caret-left, ph-caret-right, ph-globe-hemisphere-west {
      font-size: 1.5rem;
    }

    /* Estilos Responsivos (Móviles) */
    @media (max-width: 768px) {
      :host, :host([collapsed]) {
        width: 100vw !important;
        height: 65px;
        flex-direction: row;
        border-right: none;
        border-top: 2px solid var(--secondary-color);
        z-index: 1000;
        bottom: 0;
      }
      .header {
        display: none; /* Ocultamos el logo en móvil */
      }
      .nav-links {
        flex-direction: row;
        padding: 0;
        gap: 0;
      }
      .nav-item {
        flex: 1;
        justify-content: center;
        padding: 0;
      }
      .nav-item:hover {
        border-left: none;
        border-top: 4px solid var(--secondary-color);
      }
      .icon {
        margin: 0;
      }
      .text, :host([collapsed]) .text {
        display: none !important;
      }
      .footer {
        border-top: none;
        border-left: 1px solid rgba(255,255,255,0.1);
        padding: 0 1rem;
      }
    }
  `;

  @state()
  private currentTheme: 'light' | 'dark' = 'light';

  connectedCallback() {
    super.connectedCallback();
    this.initTheme();
    // Siempre iniciamos colapsados (icons only) por defecto
    this.isOpen = false;
    this.setAttribute('collapsed', '');

    this.addEventListener('mouseenter', this.handleMouseEnter);
    this.addEventListener('mouseleave', this.handleMouseLeave);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('mouseenter', this.handleMouseEnter);
    this.removeEventListener('mouseleave', this.handleMouseLeave);
  }

  private handleMouseEnter = () => {
    // Expandir en desktop al hacer hover
    if (window.innerWidth > 768) {
      this.isOpen = true;
      this.removeAttribute('collapsed');
    }
  }

  private handleMouseLeave = () => {
    // Colapsar al quitar el ratón
    if (window.innerWidth > 768) {
      this.isOpen = false;
      this.setAttribute('collapsed', '');
    }
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

  

  private navigate(e: Event, path: string) {
    e.preventDefault();
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
    
    
  }

  render() {
    return html`
      <div class="header">
        <div class="logo">
          <ph-airplane weight="duotone" style="vertical-align: middle; margin-right: 8px;"></ph-airplane> <span class="logo-text">AeroLit</span>
        </div>
        
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
        <a class="nav-item" href="/radar" @click=${(e: Event) => this.navigate(e, '/radar')}>
          <span class="icon"><ph-globe-hemisphere-west weight="duotone"></ph-globe-hemisphere-west></span>
          <span class="text">Radar en Vivo</span>
        </a>
        <a class="nav-item" href="/settings" @click=${(e: Event) => this.navigate(e, '/settings')}>
          <span class="icon"><ph-gear weight="duotone"></ph-gear></span>
          <span class="text">Ajustes</span>
        </a>
      </nav>

      <div class="footer">
        <button class="theme-toggle-btn" @click=${this.toggleTheme} title="${this.currentTheme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}">
          <span class="icon">
            ${this.currentTheme === 'light' 
              ? html`<ph-moon weight="duotone"></ph-moon>` 
              : html`<ph-sun weight="duotone"></ph-sun>`}
          </span>
          
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
