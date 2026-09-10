import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { Flight } from "../../models/flight";
import { flightService } from "../../services/flight-service";

import "../Flight-card/flight-card.ts";
import '@phosphor-icons/webcomponents/PhAirplaneTakeoff';
import '@phosphor-icons/webcomponents/PhMagnifyingGlass';

const SPANISH_AIRPORTS = [
    { iata: 'MAD', name: 'Adolfo Suárez Madrid-Barajas' },
    { iata: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat' },
    { iata: 'PMI', name: 'Palma de Mallorca' },
    { iata: 'AGP', name: 'Málaga-Costa del Sol' },
    { iata: 'ALC', name: 'Alicante-Elche Miguel Hernández' }
];

@customElement("aerolit-flights")
export class AerolitFlights extends LitElement {
    @state() private allFlights: Flight[] = [];
    @state() private flights: Flight[] = [];
    @state() private loading: boolean = true;
    @state() private error: string | null = null;

    @state() private selectedAirport: string = 'MAD';
    @state() private filterType: 'departure' | 'arrival' = 'departure';

    static styles = css`
        :host {
            display: block;
            padding: 2rem;
            color: var(--text-color);
        }
        h1 {
            color: var(--primary-color);
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            background: var(--sidebar-bg);
            padding: 1.5rem;
            border-radius: 12px;
            align-items: flex-end;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            flex-wrap: wrap;
        }
        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .filter-group label {
            font-size: 0.9rem;
            font-weight: bold;
            color: var(--secondary-color);
        }
        select {
            padding: 0.75rem;
            border-radius: 8px;
            border: 1px solid rgba(128,128,128,0.3);
            background: var(--bg-color);
            color: var(--text-color);
            font-size: 1rem;
            min-width: 200px;
            cursor: pointer;
        }
        select:focus {
            outline: none;
            border-color: var(--primary-color);
        }
        button.search-btn {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: bold;
            transition: opacity 0.2s;
        }
        button.search-btn:hover {
            opacity: 0.9;
        }
        .loading { color: var(--secondary-color); font-size: 1.2rem; }
        .error { color: var(--error-color); font-size: 1.2rem; }
        .empty { text-align: center; color: gray; font-style: italic; margin-top: 2rem; }
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

    private async fetchFlights() {
        try {
            this.allFlights = await flightService.getFlights();
            this.applyFilters();
        } catch (err) {
            this.error = 'No se pudieron cargar los vuelos.';
        } finally {
            this.loading = false;
        }
    }

    private applyFilters() {
        this.flights = this.allFlights.filter(f => {
            if (this.filterType === 'departure') {
                return f.departure?.iata === this.selectedAirport;
            } else {
                return f.arrival?.iata === this.selectedAirport;
            }
        });
    }

    private handleAirportChange(e: Event) {
        this.selectedAirport = (e.target as HTMLSelectElement).value;
    }

    private handleTypeChange(e: Event) {
        this.filterType = (e.target as HTMLSelectElement).value as 'departure' | 'arrival';
    }

    render() {
        return html`
        <h1>
            Vuelos en España 
            <ph-airplane-takeoff weight="duotone"></ph-airplane-takeoff>
        </h1>
        
        <div class="filters">
            <div class="filter-group">
                <label>Aeropuerto</label>
                <select @change=${this.handleAirportChange} .value=${this.selectedAirport}>
                    ${SPANISH_AIRPORTS.map(ap => html`<option value="${ap.iata}">${ap.name} (${ap.iata})</option>`)}
                </select>
            </div>
            
            <div class="filter-group">
                <label>Tipo</label>
                <select @change=${this.handleTypeChange} .value=${this.filterType}>
                    <option value="departure">Salidas</option>
                    <option value="arrival">Llegadas</option>
                </select>
            </div>

            <button class="search-btn" @click=${this.applyFilters}>
                <ph-magnifying-glass weight="bold"></ph-magnifying-glass>
                Buscar Vuelos
            </button>
        </div>

        ${this.loading ? html`<p class="loading">Cargando vuelos...</p>` : ''}
        ${this.error ? html`<p class="error">Error: ${this.error}</p>` : ''}
        
        ${!this.loading && !this.error ? html`
            ${this.flights.length === 0 ? html`<p class="empty">No se encontraron vuelos para los filtros seleccionados.</p>` : html`
                <div class="flight-grid">
                    ${this.flights.map(f => html`<flight-card .flight=${f}></flight-card>`)}
                </div>
            `}
        ` : ''}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "aerolit-flights": AerolitFlights;
    }
}
