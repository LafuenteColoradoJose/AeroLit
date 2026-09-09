import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { Flight } from "../../models/flight";

import "../Flight-card/flight-card.ts";

@customElement("aerolit-flights")
export class AerolitFlights extends LitElement {
    @state() private flights: Flight[] = [];
    @state() private loading: boolean = true;
    @state() private error: string | null = null;

    static styles = css`
        :host {
            display: block;
            padding: 2rem;
        }
        h1 {
            color: var(--primary-color);
            margin-bottom: 2rem;
        }
        .loading { color: var(--secondary-color); font-size: 1.2rem; }
        .error { color: var(--error-color); font-size: 1.2rem; }
        .flight-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        this.fetchFlights();
    }

    async fetchFlights() {
        this.loading = true;
        this.error = null;
        try {
            const response = await fetch('/src/assets/mock-flights.json');
            if (!response.ok) throw new Error('Error al cargar los vuelos');
            const json = await response.json();
            if (json.error) throw new Error(json.error.message || 'Error en la API');
            this.flights = json.data;
        } catch (err: any) {
            this.error = err.message;
        } finally {
            this.loading = false;
        }
    }

    render() {
        return html`
        <h1>Todos los Vuelos 🛫</h1>
        ${this.loading ? html`<p class="loading">Cargando radar...</p>` : ''}
        ${this.error ? html`<p class="error">Error: ${this.error}</p>` : ''}
        ${!this.loading && !this.error ? html`
            <div class="flight-grid">
                ${this.flights.map(f => html`<flight-card .flight=${f}></flight-card>`)}
            </div>
        ` : ''}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "aerolit-flights": AerolitFlights;
    }
}
