import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { flightService } from '../../services/flight-service';
import { SPANISH_AIRPORTS } from '../../data/spanish-airports';
import type { Flight } from '../../models/flight';
import '../Flight-card/flight-card';
import '../AeroLit-dashboard/live-clock';
import '@phosphor-icons/webcomponents/PhAirplaneTakeoff';
import '@phosphor-icons/webcomponents/PhListDashes';
import '@phosphor-icons/webcomponents/PhSquaresFour';
import '@phosphor-icons/webcomponents/PhMagnifyingGlass';
import '@phosphor-icons/webcomponents/PhCaretLeft';
import '@phosphor-icons/webcomponents/PhCaretRight';

const ITEMS_PER_PAGE = 20;

/**
 * Componente principal para el panel de vuelos de AeroLit.
 * Renderiza, filtra, página y auto-actualiza los vuelos en base a la fecha real del sistema.
 * @element aerolit-flights
 */
@customElement('aerolit-flights')
export class AerolitFlights extends LitElement {
    /** Almacena todos los vuelos originales obtenidos del motor simulado. */
    @state() private allFlights: Flight[] = [];
    /** Almacena los vuelos filtrados por todos los criterios antes de paginar. */
    @state() private flights: Flight[] = [];
    /** Almacena el segmento de vuelos de la página actual para renderizado rápido. */
    @state() private pagedFlights: Flight[] = [];
    /** Indica si el panel de vuelos está en estado de carga de datos iniciales. */
    @state() private loading: boolean = true;
    /** Almacena un posible mensaje de error durante la carga de red. */
    @state() private error: string | null = null;

    /** Aeropuerto IATA seleccionado actualmente (ej. 'MAD', 'BCN'). */
    @state() private selectedAirport: string = 'MAD';
    /** Dirección de vuelos a mostrar: Salidas o Llegadas. */
    @state() private filterType: 'departure' | 'arrival' = 'departure';
    /** Filtro de estado del vuelo ('all', 'scheduled', 'active', 'landed', 'cancelled'). */
    @state() private statusFilter: string = 'all';
    /** Término de búsqueda de texto ingresado por el usuario (aerolínea, nº vuelo, IATA). */
    @state() private searchQuery: string = '';
    
    /** Modo de visualización actual de la UI (lista detallada o tarjetas cuadriculadas). */
    @state() private viewMode: 'grid' | 'list' = 'list';
    
    /** Página actualmente visible en el UI para la paginación de resultados. */
    @state() private currentPage: number = 1;
    /** Cantidad total de páginas disponibles basadas en los resultados filtrados. */
    @state() private totalPages: number = 1;
    /** Referencia al timer de intervalo de actualización automática en tiempo real. */
    private updateInterval: number | null = null;

    static styles = css`
        :host {
            display: block;
            padding: 2rem;
            background: var(--bg-color);
            min-height: 100vh;
        }

        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }

        h1 {
            color: var(--primary-color);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 2rem;
        }

        .view-controls {
            display: flex;
            gap: 10px;
        }

        .view-btn {
            background: var(--surface-color);
            border: 1px solid rgba(128, 128, 128, 0.2);
            color: var(--text-color);
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .view-btn:hover { background: rgba(128, 128, 128, 0.1); }
        .view-btn.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }

        .filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            background: var(--surface-color);
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            flex-wrap: wrap;
            align-items: flex-end;
        }

        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            flex: 1;
            min-width: 200px;
        }

        .filter-group label {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-color);
            opacity: 0.8;
        }

        select, input {
            padding: 0.75rem;
            border-radius: 8px;
            border: 1px solid rgba(128, 128, 128, 0.3);
            background: var(--bg-color);
            color: var(--text-color);
            font-size: 1rem;
            outline: none;
            transition: border-color 0.2s;
        }
        
        select:focus, input:focus {
            border-color: var(--primary-color);
        }

        .search-btn {
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.2s;
            height: 45px;
        }

        .search-btn:hover { background: #1a494f; }

        .loading, .error, .empty { text-align: center; font-size: 1.2rem; margin-top: 3rem; opacity: 0.7; }
        .error { color: #dc2626; }

        .flight-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.5rem;
        }

        /* Ajustes Mobile de la Cabecera (Idea 3) */
        @media (max-width: 768px) {
            :host {
                padding: 1rem;
            }
            
            .header-container {
                margin-bottom: 1rem;
            }

            .header-left {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.2rem;
            }

            h1 {
                font-size: 1.5rem;
                gap: 6px;
            }
        }

        /* VISTA LISTA (PANEL TIPO AEROPUERTO) */
        .flight-list {
            display: flex;
            flex-direction: column;
            background: var(--surface-color);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            border: 1px solid rgba(128,128,128,0.15);
        }

        .list-header {
            display: grid;
            grid-template-columns: 1.5fr 2fr 1fr 2fr 1fr 1fr;
            padding: 1rem 1.5rem;
            background: var(--primary-color);
            color: white;
            font-weight: bold;
            font-size: 0.9rem;
            letter-spacing: 0.05em;
        }

        .list-row {
            display: grid;
            grid-template-columns: 1.5fr 2fr 1fr 2fr 1fr 1fr;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid rgba(128,128,128,0.1);
            align-items: center;
            transition: background 0.2s;
        }

        .list-row:hover { background: rgba(128, 128, 128, 0.05); }
        .list-row:last-child { border-bottom: none; }

        .col-time { font-weight: 800; font-size: 1rem; color: var(--text-color); white-space: nowrap; }
        .col-dest { font-weight: 600; font-size: 0.95rem; }
        .col-flight { font-family: monospace; font-size: 1rem; color: var(--text-color); font-weight: 700; opacity: 0.85; }
        .col-airline { font-size: 0.95rem; color: var(--text-color); }
        .col-gate { font-weight: 800; text-align: center; background: rgba(0,0,0,0.05); padding: 0.2rem; border-radius: 4px; font-size: 0.9rem; }
        
        .col-status {
            font-size: 0.75rem;
            font-weight: bold;
            padding: 0.35rem 0.5rem;
            border-radius: 1rem;
            text-align: center;
            text-transform: uppercase;
        }

        .status-scheduled { background-color: rgba(2, 132, 199, 0.1); color: #0284c7; }
        .status-active { background-color: rgba(22, 163, 74, 0.1); color: #16a34a; }
        .status-landed { background-color: rgba(75, 85, 99, 0.1); color: #4b5563; }
        .status-cancelled { background-color: rgba(220, 38, 38, 0.1); color: #dc2626; }

        /* Paginación */
        .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1.5rem;
            margin-top: 2rem;
            padding-bottom: 2rem;
        }
        
        .page-btn {
            background: var(--surface-color);
            border: 1px solid rgba(128, 128, 128, 0.3);
            color: var(--text-color);
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }
        
        .page-btn:hover:not(:disabled) {
            border-color: var(--primary-color);
            color: var(--primary-color);
        }
        
        .page-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .page-info {
            font-weight: 600;
            font-size: 1rem;
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        this.fetchFlights();
        
        // Refresca cada minuto para sincronizar estado y reordenar
        this.updateInterval = window.setInterval(() => {
            if (!document.hidden) {
                // Forzamos un fetch ligero para re-calcular estados (scheduled/active/landed)
                this.fetchFlights();
            }
        }, 60000);
    }

    /**
     * Hook del ciclo de vida que se asegura de limpiar los intervalos
     * de refresco al destruir el componente para evitar fugas de memoria.
     */
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
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

    /**
     * Aplica toda la cadena de filtros en el siguiente orden:
     * 1. Aeropuerto de salida/llegada
     * 2. Búsqueda de texto (aerolínea o códigos IATA)
     * 3. Filtro de estado
     * Luego re-ordena la lista por prioridad operativa y genera la vista paginada.
     */
    private applyFilters() {
        // 1. Filtrar por aeropuerto y tipo
        let filtered = this.allFlights.filter(f => {
            if (this.filterType === 'departure') {
                return f.departure?.iata === this.selectedAirport;
            } else {
                return f.arrival?.iata === this.selectedAirport;
            }
        });

        // 2. Filtrar por estado
        if (this.statusFilter !== 'all') {
            filtered = filtered.filter(f => f.flight_status.toLowerCase() === this.statusFilter);
        }

        // 3. Filtrar por buscador (Aerolínea, Num Vuelo o IATA)
        if (this.searchQuery.trim().length > 0) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(f => {
                const flightNum = (f.flight.iata || f.flight.number || '').toLowerCase();
                const airlineName = (f.airline.name || '').toLowerCase();
                const destOrigin = this.filterType === 'departure' ? (f.arrival.iata || '').toLowerCase() : (f.departure.iata || '').toLowerCase();
                
                return flightNum.includes(query) || airlineName.includes(query) || destOrigin.includes(query);
            });
        }

        // 4. Ordenar con prioridad UX aeroportuaria: Programados > Activos > Aterrizados/Cancelados
        const statusWeight: Record<string, number> = {
            'scheduled': 1,
            'active': 2,
            'landed': 3,
            'cancelled': 4,
            'incident': 4,
            'diverted': 4
        };

        filtered.sort((a, b) => {
            const statusA = (a.flight_status || '').toLowerCase();
            const statusB = (b.flight_status || '').toLowerCase();
            const weightA = statusWeight[statusA] || 99;
            const weightB = statusWeight[statusB] || 99;
            
            // 1º Prioridad: El estado del vuelo
            if (weightA !== weightB) {
                return weightA - weightB;
            }
            
            // 2º Prioridad: Orden cronológico dentro del mismo estado
            const timeA = new Date(this.filterType === 'departure' ? (a.departure?.scheduled || 0) : (a.arrival?.scheduled || 0)).getTime();
            const timeB = new Date(this.filterType === 'departure' ? (b.departure?.scheduled || 0) : (b.arrival?.scheduled || 0)).getTime();
            
            if (weightA === 1) {
                // Si están programados (futuro): los más inminentes primero (ascendente)
                return timeA - timeB;
            } else {
                // Si están activos/aterrizados (pasado): los más recientes primero (descendente)
                return timeB - timeA;
            }
        });

        this.flights = filtered;
        this.totalPages = Math.ceil(this.flights.length / ITEMS_PER_PAGE) || 1;
        this.currentPage = 1; // Volver a la página 1 al filtrar
        this.updatePagedFlights();
    }

    /**
     * Calcula y segmenta la porción de vuelos que se mostrará en la vista
     * en función de la página actualmente seleccionada.
     */
    private updatePagedFlights() {
        const startIndex = (this.currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        this.pagedFlights = this.flights.slice(startIndex, endIndex);
    }

    /** Manejador de cambio para el selector de aeropuerto */
    private handleAirportChange(e: Event) {
        this.selectedAirport = (e.target as HTMLSelectElement).value;
    }

    /** Manejador de cambio para el selector de dirección (llegada/salida) */
    private handleTypeChange(e: Event) {
        this.filterType = (e.target as HTMLSelectElement).value as 'departure' | 'arrival';
    }

    /** Manejador de cambio para el selector de estado de vuelos */
    private handleStatusChange(e: Event) {
        this.statusFilter = (e.target as HTMLSelectElement).value;
    }

    /** Manejador del input de texto de búsqueda que se dispara en cada pulsación */
    private handleSearchInput(e: Event) {
        this.searchQuery = (e.target as HTMLInputElement).value;
    }
    
    /** Ejecuta los filtros cuando el usuario presiona Enter en la barra de búsqueda */
    private handleSearchKeyup(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            this.applyFilters();
        }
    }

    /**
     * Formatea una cadena de fecha ISO a un formato de UI legible (DD/MM - HH:mm).
     * @param dateString Cadena de fecha a formatear.
     * @returns {string} Fecha formateada o '--:--' si es nula.
     */
    private formatTime(dateString: string) {
        if (!dateString) return '--:--';
        const d = new Date(dateString);
        const date = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return `${date} - ${time}`;
    }
    
    /** Cambia a la página anterior en el sistema de paginación de la UI */
    private prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagedFlights();
        }
    }
    
    /** Avanza a la siguiente página en el sistema de paginación de la UI */
    private nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagedFlights();
        }
    }

    render() {
        return html`
        <div class="header-container">
            <div class="header-left">
                <h1>
                    Vuelos en España 
                    <ph-airplane-takeoff weight="duotone"></ph-airplane-takeoff>
                </h1>
                <live-clock></live-clock>
            </div>
            
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
                    ${SPANISH_AIRPORTS.map((ap: any) => html`<option value="${ap.iata}" ?selected=${ap.iata === this.selectedAirport}>${ap.name} (${ap.iata})</option>`)}
                </select>
            </div>
            
            <div class="filter-group">
                <label>Dirección</label>
                <select @change=${this.handleTypeChange} .value=${this.filterType}>
                    <option value="departure">Salidas</option>
                    <option value="arrival">Llegadas</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label>Estado</label>
                <select @change=${this.handleStatusChange} .value=${this.statusFilter}>
                    <option value="all">Todos los estados</option>
                    <option value="scheduled">Programados</option>
                    <option value="active">Activos (En Aire)</option>
                    <option value="landed">Aterrizados</option>
                    <option value="cancelled">Cancelados</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label>Buscar</label>
                <input type="text" placeholder="Aerolínea, vuelo, IATA..." 
                       .value=${this.searchQuery} 
                       @input=${this.handleSearchInput}
                       @keyup=${this.handleSearchKeyup}>
            </div>

            <button class="search-btn" @click=${this.applyFilters}>
                <ph-magnifying-glass weight="bold"></ph-magnifying-glass>
                Filtrar
            </button>
        </div>

        ${this.loading ? html`<p class="loading">Cargando vuelos...</p>` : ''}
        ${this.error ? html`<p class="error">Error: ${this.error}</p>` : ''}
        
        ${!this.loading && !this.error ? html`
            ${this.flights.length === 0 ? html`<p class="empty">No se encontraron vuelos para los filtros seleccionados.</p>` : html`
                
                ${this.viewMode === 'grid' ? html`
                    <div class="flight-grid">
                        ${this.pagedFlights.map(f => html`<flight-card .flight=${f}></flight-card>`)}
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
                        ${this.pagedFlights.map(f => {
                            const timeStr = this.filterType === 'departure' ? f.departure.scheduled : f.arrival.scheduled;
                            const rawDest = this.filterType === 'departure' ? f.arrival.airport : f.departure.airport;
                            const targetIata = this.filterType === 'departure' ? f.arrival.iata : f.departure.iata;
                            
                            let finalDestName = rawDest;
                            if (finalDestName === "Aeropuerto AENA") {
                                const found = SPANISH_AIRPORTS.find((a: any) => a.iata === targetIata);
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
                
                <!-- Paginación UI -->
                ${this.totalPages > 1 ? html`
                <div class="pagination">
                    <button class="page-btn" @click=${this.prevPage} ?disabled=${this.currentPage === 1}>
                        <ph-caret-left weight="bold"></ph-caret-left> Anterior
                    </button>
                    <span class="page-info">Página ${this.currentPage} de ${this.totalPages} (${this.flights.length} vuelos)</span>
                    <button class="page-btn" @click=${this.nextPage} ?disabled=${this.currentPage === this.totalPages}>
                        Siguiente <ph-caret-right weight="bold"></ph-caret-right>
                    </button>
                </div>
                ` : ''}

            `}
        ` : ''}
        `;
    }
}
