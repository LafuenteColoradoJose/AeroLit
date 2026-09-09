import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { Flight } from "../../models/flight";

// Importamos el nuevo componente hijo
import "../Flight-card/flight-card";

@customElement("aerolit-dashboard")
export class AerolitDashboard extends LitElement {

    @state()
    private flights: Flight[] = [];

    @state()
    private loading: boolean = true;

    @state()
    private error: string | null = null;

    static styles = [
        css`
            :host {
                display: block;
                padding: 2rem;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            h1 {
                color: var(--primary-color);
                text-align: center;
                margin-bottom: 2rem;
            }

            .loading { color: var(--secondary-color); text-align: center; font-size: 1.2rem; }
            .error { color: var(--error-color); text-align: center; font-size: 1.2rem; }
            
            /* GRID RESPONSIVE PARA LAS TARJETAS */
            .flight-grid {
                display: grid;
                /* Magia de CSS Grid: auto-ajusta las columnas según el espacio. 
                   Mínimo 300px por tarjeta, máximo lo que sobre (1fr) */
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
            }
        `
    ];

    connectedCallback() {
        super.connectedCallback();
        this.fetchFlights();
    }

    async fetchFlights() {
        this.loading = true;
        this.error = null;
        
        try {
            const response = await fetch('/src/assets/mock-flights.json');
            
            if (!response.ok) {
                throw new Error('Error al cargar los vuelos');
            }

            const json = await response.json();
            
            if (json.error) {
                throw new Error(json.error.message || 'Error en la API');
            }

            this.flights = json.data;
        } catch (err: any) {
            this.error = err.message;
            console.error("Error fetching flights:", err);
        } finally {
            this.loading = false;
        }
    }

    render() {
        return html`
        <h1>AeroLit Dashboard ✈️</h1>
        
        ${this.loading ? html`<p class="loading">Buscando vuelos en el radar...</p>` : ''}
        
        ${this.error ? html`<p class="error">Error: ${this.error}</p>` : ''}
        
        ${!this.loading && !this.error ? html`
            <div class="flight-grid">
                <!-- Inyectamos el componente hijo (flight-card) pasándole la propiedad (flight) -->
                ${this.flights.map(flight => html`
                    <flight-card .flight=${flight}></flight-card>
                `)}
            </div>
        ` : ''}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "aerolit-dashboard": AerolitDashboard;
    }
}
