import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { Flight } from "../../models/flight";
import { flightService } from "../../services/flight-service";

import "../Flight-card/flight-card.ts";
import '@phosphor-icons/webcomponents/PhAirplaneTakeoff';
import '@phosphor-icons/webcomponents/PhMagnifyingGlass';
import '@phosphor-icons/webcomponents/PhSquaresFour';
import '@phosphor-icons/webcomponents/PhListDashes';
import { SPANISH_AIRPORTS } from "../../data/spanish-airports";

@customElement("aerolit-flights")
export class AerolitFlights extends LitElement {
    @state() private allFlights: Flight[] = [];
    @state() private flights: Flight[] = [];
    @state() private loading: boolean = true;
    @state() private error: string | null = null;

    @state() private selectedAirport: string = 'MAD';
    @state() private filterType: 'departure' | 'arrival' = 'departure';
    
    // Nueva vista: panel vs tarjetas (Por defecto list para evitar scroll masivo)
    @state() private viewMode: 'grid' | 'list' = 'list';

    static styles = css`
        :host {
            display: block;
            padding: 2rem;
            color: var(--text-color);
        }
        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        h1 {
            color: var(--primary-color);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .view-controls {
            display: flex;
            gap: 0.5rem;
            background: var(--sidebar-bg);
            padding: 0.5rem;
            border-radius: 8px;
        }
        .view-btn {
            background: transparent;
            border: none;
            color: var(--secondary-color);
            padding: 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            transition: all 0.2s;
        }
        .view-btn:hover {
            color: var(--primary-color);
            background: rgba(0,0,0,0.05);
        }
        .view-btn.active {
            color: var(--primary-color);
            background: var(--bg-color);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
        
        /* Resultados */
        .loading { color: var(--secondary-color); font-size: 1.2rem; }
        .error { color: var(--error-color); font-size: 1.2rem; }
        .empty { text-align: center; color: gray; font-style: italic; margin-top: 2rem; }
        
        .flight-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }

        /* Vista Panel de Aeropuerto */
        .flight-list {
            display: flex;
            flex-direction: column;
            background: var(--card-bg);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .list-header, .list-row {
            display: grid;
            grid-template-columns: 130px 2fr 1fr 1.5fr 80px 100px;
            gap: 1rem;
            padding: 1rem 1.5rem;
            align-items: center;
        }
        .list-header {
            background: var(--sidebar-bg);
            font-weight: bold;
            color: var(--secondary-color);
            font-size: 0.85rem;
            text-transform: uppercase;
            border-bottom: 2px solid rgba(0,0,0,0.05);
        }
        .list-row {
            border-bottom: 1px solid rgba(0,0,0,0.05);
            transition: background 0.2s;
        }
        .list-row:last-child {
            border-bottom: none;
        }
        .list-row:hover {
            background: var(--bg-color);
        }

        .col-time { font-weight: 800; font-size: 1rem; color: var(--text-color); white-space: nowrap; }
        .col-dest { font-weight: 600; font-size: 0.95rem; }
        .col-flight { font-family: monospace; font-size: 1rem; color: var(--text-color); font-weight: 700; opacity: 0.85; }
        .col-airline { font-size: 0.95rem; color: var(--text-color); }
        .col-gate { 
            font-weight: 800; 
            text-align: center; 
            background: rgba(0,0,0,0.05); 
            padding: 0.2rem; 
            border-radius: 4px; 
            font-size: 0.9rem;
        }
        .col-status {
            font-size: 0.75rem;
            font-weight: bold;
            padding: 0.35rem 0.5rem;
            border-radius: 1rem;
            text-align: center;
            text-transform: uppercase;
        }

        /* Colores de estado simplificados */
        .status-scheduled { background-color: rgba(2, 132, 199, 0.1); color: #0284c7; }
        .status-active { background-color: rgba(22, 163, 74, 0.1); color: #16a34a; }
        .status-landed { background-color: rgba(75, 85, 99, 0.1); color: #4b5563; }
        .status-cancelled { background-color: rgba(220, 38, 38, 0.1); color: #dc2626; }
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
        // 1. Filtrar por aeropuerto y tipo
        const filtered = this.allFlights.filter(f => {
            if (this.filterType === 'departure') {
                return f.departure?.iata === this.selectedAirport;
            } else {
                return f.arrival?.iata === this.selectedAirport;
            }
        });

        // 2. Ordenar cronológicamente
        this.flights = filtered.sort((a, b) => {
            const timeA = new Date(this.filterType === 'departure' ? a.departure.scheduled : a.arrival.scheduled).getTime();
            const timeB = new Date(this.filterType === 'departure' ? b.departure.scheduled : b.arrival.scheduled).getTime();
            return timeA - timeB;
        });
    }

    private handleAirportChange(e: Event) {
        this.selectedAirport = (e.target as HTMLSelectElement).value;
    }

    private handleTypeChange(e: Event) {
        this.filterType = (e.target as HTMLSelectElement).value as 'departure' | 'arrival';
    }

    private formatTime(dateString: string) {
        if (!dateString) return '--:--';
        const d = new Date(dateString);
        const date = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return `${date} - ${time}`;
    }

    render() {
        return html`
        <div class="header-container">
            <h1>
                Vuelos en España 
                <ph-airplane-takeoff weight="duotone"></ph-airplane-takeoff>
            </h1>
            
            <div class="view-controls">
                <button class="view-btn ${this.viewMode === 'list' ? 'active' : ''}" @click=${() => this.viewMode = 'list'} title="Vista Lista">
                    <ph-list-dashes weight="bold"></ph-list-dashes>
                </button>
                <button class="view-btn ${this.viewMode === 'grid' ? 'active' : ''}" @click=${() => this.viewMode = 'grid'} title="Vista Cuadrícula">
                    <ph-squares-four weight="fill"></ph-squares-four>
                </button>
            </div>
        </div>
        
        <div class="filters">
            <div class="filter-group">
                <label>Aeropuerto</label>
                <select @change=${this.handleAirportChange} .value=${this.selectedAirport}>
                    ${SPANISH_AIRPORTS.map(ap => html`<option value="${ap.iata}" ?selected=${ap.iata === this.selectedAirport}>${ap.name} (${ap.iata})</option>`)}
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
                
                ${this.viewMode === 'grid' ? html`
                    <div class="flight-grid">
                        ${this.flights.map(f => html`<flight-card .flight=${f}></flight-card>`)}
                    </div>
                ` : html`
                    <div class="flight-list">
                        <div class="list-header">
                            <span class="col-time">Fecha y Hora</span>
                            <span class="col-dest">${this.filterType === 'departure' ? 'Destino' : 'Origen'}</span>
                            <span class="col-flight">Vuelo</span>
                            <span class="col-airline">Aerolínea</span>
                            <span class="col-gate">Puerta</span>
                            <span class="col-status">Estado</span>
                        </div>
                        ${this.flights.map(f => {
                            const timeStr = this.filterType === 'departure' ? f.departure.scheduled : f.arrival.scheduled;
                            const rawDest = this.filterType === 'departure' ? f.arrival.airport : f.departure.airport;
                            const targetIata = this.filterType === 'departure' ? f.arrival.iata : f.departure.iata;
                            // Si dice "Aeropuerto AENA", buscamos el nombre real
                            let finalDestName = rawDest;
                            if (finalDestName === "Aeropuerto AENA") {
                                const found = SPANISH_AIRPORTS.find(a => a.iata === targetIata);
                                finalDestName = found ? found.name : targetIata;
                            }
                            const destOrigin = `${finalDestName} (${targetIata})`;
                            const gate = this.filterType === 'departure' ? f.departure.gate : f.arrival.gate;
                            return html`
                            <div class="list-row">
                                <span class="col-time">${this.formatTime(timeStr)}</span>
                                <span class="col-dest">${destOrigin}</span>
                                <span class="col-flight">${f.flight.iata || f.flight.number}</span>
                                <span class="col-airline">${f.airline.name}</span>
                                <span class="col-gate">${gate || '-'}</span>
                                <span class="col-status status-${f.flight_status.toLowerCase()}">
                                    ${f.flight_status.toUpperCase()}
                                </span>
                            </div>
                            `;
                        })}
                    </div>
                `}

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
