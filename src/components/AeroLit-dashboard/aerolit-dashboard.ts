import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import '@phosphor-icons/webcomponents/PhChartBar';
import '@phosphor-icons/webcomponents/PhAirplaneInFlight';
import '@phosphor-icons/webcomponents/PhXCircle';
import '@phosphor-icons/webcomponents/PhClock';
import '@phosphor-icons/webcomponents/PhListChecks';
import { flightService, type KpiStats } from '../../services/flight-service';
import './kpi-card';
import './urgent-flights';

@customElement("aerolit-dashboard")
export class AerolitDashboard extends LitElement {
    @state()
    private stats: KpiStats | null = null;

    static styles = css`
        .dashboard-container {
            padding: 2rem;
            color: var(--text-color);
        }
        h1 {
            color: var(--primary-color);
            margin-top: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
    `;

    async connectedCallback() {
        super.connectedCallback();
        try {
            this.stats = await flightService.getKpiStats();
        } catch (error) {
            console.error('Error loading stats', error);
        }
    }

    render() {
        return html`
      <div class="dashboard-container">
        <h1>AeroLit Dashboard <ph-chart-bar weight="duotone"></ph-chart-bar></h1>
        <p>Bienvenido al sistema de control de vuelos.</p>

        ${this.stats ? html`
          <div class="kpi-grid">
            <kpi-card title="Total Vuelos" value="${this.stats.total}" colorType="primary" trend="+5% hoy" trendDirection="up">
              <ph-list-checks slot="icon" weight="duotone"></ph-list-checks>
            </kpi-card>
            <kpi-card title="En Vuelo" value="${this.stats.active}" colorType="secondary" trend="estable" trendDirection="none">
              <ph-airplane-in-flight slot="icon" weight="duotone"></ph-airplane-in-flight>
            </kpi-card>
            <kpi-card title="Programados" value="${this.stats.scheduled}" colorType="neutral" trend="+2% mañana" trendDirection="up">
              <ph-clock slot="icon" weight="duotone"></ph-clock>
            </kpi-card>
            <kpi-card title="Cancelados" value="${this.stats.cancelled}" colorType="error" trend="-1% este mes" trendDirection="down">
              <ph-x-circle slot="icon" weight="duotone"></ph-x-circle>
            </kpi-card>
          </div>
          
          <urgent-flights></urgent-flights>
        ` : html`<p>Cargando estadísticas...</p>`}
      </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "aerolit-dashboard": AerolitDashboard;
    }
}
