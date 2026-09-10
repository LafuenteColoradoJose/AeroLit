import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import '@phosphor-icons/webcomponents/PhChartBar';

@customElement("aerolit-dashboard")
export class AerolitDashboard extends LitElement {
    static styles = css`
        :host {
            display: block;
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: var(--primary-color);
            margin-bottom: 2rem;
        }
        p {
            color: var(--text-color);
        }
    `;

    render() {
        return html`
      <div class="dashboard-container">
        <h1>AeroLit Dashboard <ph-chart-bar weight="duotone" style="vertical-align: middle;"></ph-chart-bar></h1>
        <p>Bienvenido al sistema de control de vuelos.</p>
      </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "aerolit-dashboard": AerolitDashboard;
    }
}
