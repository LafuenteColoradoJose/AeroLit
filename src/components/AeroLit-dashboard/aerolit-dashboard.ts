import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import '@phosphor-icons/webcomponents/PhChartBar';
import '@phosphor-icons/webcomponents/PhAirplaneInFlight';
import '@phosphor-icons/webcomponents/PhXCircle';
import '@phosphor-icons/webcomponents/PhClock';
import '@phosphor-icons/webcomponents/PhListChecks';
import '@phosphor-icons/webcomponents/PhCode';
import '@phosphor-icons/webcomponents/PhGithubLogo';
import '@phosphor-icons/webcomponents/PhLinkedinLogo';
import { flightService, type KpiStats } from '../../services/flight-service';
import './kpi-card';
import './urgent-flights';
import './activity-chart';
import './live-clock';

/**
 * Componente contenedor principal del Panel de Control (Dashboard).
 * Orquesta la visualización de KPIs, gráficos de actividad y tablas de vuelos.
 * 
 * @element aerolit-dashboard
 */
@customElement('aerolit-dashboard')
export class AerolitDashboard extends LitElement {
    @state()
    private stats: KpiStats |/** Estado reactivo que almacena los KPIs procesados por el motor híbrido */
     null = null;

    

    static styles = css`
        :host {
            display: block;
            width: 100%;
            box-sizing: border-box;
        }
        .dashboard-container {
            padding: 2rem;
            color: var(--text-color);
            box-sizing: border-box;
            max-width: 100%;
            overflow-x: hidden;
        }
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
        }
        h1 {
            color: var(--primary-color);
            margin-top: 0;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .header-titles p {
            margin: 0;
            opacity: 0.8;
            font-size: 1.1rem;
        }
        
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        /* Flex container para los gráficos y vuelos urgentes en desktop */
        .dashboard-widgets {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
            margin-top: 2rem;
            min-width: 0; /* Permite a los hijos encogerse por debajo de su contenido interno (útil para Canvas/Gráficas) */
        }
        @media (min-width: 1024px) {
            .dashboard-widgets {
                grid-template-columns: 1fr 1fr;
            }
        }
        
        /* Mobile Credits Card - por defecto oculto */
        .mobile-credits-card {
            display: none;
        }
        
        /* Ajustes Mobile */
        @media (max-width: 768px) {
            .dashboard-container {
                padding: 1rem;
                padding-bottom: 3rem;
            }
            .dashboard-header {
                flex-direction: column;
            }
            h1 {
                font-size: 1.5rem;
            }
            .kpi-grid {
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }
            
            /* Tarjeta visible en móviles */
            .mobile-credits-card {
                display: flex;
                flex-direction: column;
                align-items: center;
                background-color: var(--card-bg);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 1.5rem;
                margin-top: 2rem;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                text-align: center;
            }
            .mobile-credits-card .developed-by {
                color: var(--text-color);
                opacity: 0.7;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .mobile-credits-card .author-name {
                font-size: 1.1rem;
                font-weight: 700;
                color: var(--secondary-color);
                text-decoration: none;
                margin-bottom: 1rem;
            }
            .mobile-credits-card .social-links {
                display: flex;
                gap: 1.5rem;
            }
            .mobile-credits-card .social-link {
                color: var(--text-color);
                opacity: 0.8;
                font-size: 1.5rem;
                text-decoration: none;
            }
            .mobile-credits-card .social-link:hover {
                color: var(--secondary-color);
                opacity: 1;
            }
        }
    `;

    private uiTickInterval?: number;

    async connectedCallback() {
        super.connectedCallback();
        flightService.startHybridEngine();
        
        try {
            this.stats = await flightService.getKpiStats();
        } catch (error) {
            console.error('Error loading stats', error);
        }

        // Refrescar la UI cada 1 minuto
        this.uiTickInterval = window.setInterval(async () => {
            try {
                this.stats = await flightService.getKpiStats();
                const activityChart = this.shadowRoot?.querySelector('activity-chart') as any;
                if (activityChart && typeof activityChart.refresh === 'function') {
                    activityChart.refresh();
                }
                const urgentFlights = this.shadowRoot?.querySelector('urgent-flights') as any;
                if (urgentFlights && typeof urgentFlights.refresh === 'function') {
                    urgentFlights.refresh();
                }
            } catch(e) {
                console.error('Tick update failed', e);
            }
        }, 60 * 1000);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.uiTickInterval) {
            window.clearInterval(this.uiTickInterval);
        }
    }



    render() {
        return html`
      <div class="dashboard-container">
        <div class="dashboard-header">
            <div class="header-titles">
                <h1>AeroLit Dashboard <ph-chart-bar weight="duotone"></ph-chart-bar></h1>
                <p>Bienvenido al sistema de control de vuelos de España.</p>
            </div>
            <live-clock></live-clock>
        </div>

        ${this.stats ? html`
          <div class="kpi-grid">
            <kpi-card title="Total Vuelos" value="${this.stats.total}" colorType="primary" trend="+5% hoy" trendDirection="up">
              <ph-list-checks slot="icon" weight="duotone"></ph-list-checks>
            </kpi-card>
            <kpi-card title="En Vuelo" value="${this.stats.active}" colorType="secondary" trend="${this.stats.activeTrend}" trendDirection="up">
              <ph-airplane-in-flight slot="icon" weight="duotone"></ph-airplane-in-flight>
            </kpi-card>
            <kpi-card title="Cancelados" value="${this.stats.cancelled}" colorType="error" trend="-1% este mes" trendDirection="down">
              <ph-x-circle slot="icon" weight="duotone"></ph-x-circle>
            </kpi-card>
            <kpi-card title="Aterrizados" value="${this.stats.landed}" colorType="neutral" trend="${this.stats.scheduledTrend}" trendDirection="none">
              <ph-clock slot="icon" weight="duotone"></ph-clock>
            </kpi-card>
          </div>
          
          <div class="dashboard-widgets">
            <urgent-flights></urgent-flights>
            <activity-chart></activity-chart>
          </div>
        ` : html`<p>Cargando estadísticas...</p>`}
        
        <!-- Tarjeta de créditos (Solo visible en móviles) -->
        <div class="mobile-credits-card">
          <div class="developed-by">
            <ph-code weight="bold"></ph-code> Desarrollado por
          </div>
          <a class="author-name" href="https://www.joselafuente.dev" target="_blank" rel="noopener" aria-label="Portfolio de José Lafuente">
            José Lafuente
          </a>
          <div class="social-links">
            <a class="social-link" href="https://github.com/LafuenteColoradoJose" target="_blank" rel="noopener" aria-label="Perfil de GitHub" title="GitHub">
              <ph-github-logo weight="fill"></ph-github-logo>
            </a>
            <a class="social-link" href="https://www.linkedin.com/in/joselafuentecolorado" target="_blank" rel="noopener" aria-label="Perfil de LinkedIn" title="LinkedIn">
              <ph-linkedin-logo weight="fill"></ph-linkedin-logo>
            </a>
          </div>
        </div>
      </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "aerolit-dashboard": AerolitDashboard;
    }
}
