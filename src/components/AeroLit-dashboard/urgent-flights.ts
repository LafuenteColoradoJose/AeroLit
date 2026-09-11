import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { Flight } from '../../models/flight';
import { flightService } from '../../services/flight-service';
import '@phosphor-icons/webcomponents/PhWarning';
import '@phosphor-icons/webcomponents/PhArrowRight';
import '@phosphor-icons/webcomponents/PhAirplaneTakeoff';
import '@phosphor-icons/webcomponents/PhClock';

/**
 * Tabla de vuelos críticos que requieren atención inmediata.
 * Si no hay vuelos urgentes, muta automáticamente para mostrar los "Próximos Vuelos Programados".
 * 
 * @element urgent-flights
 */
@customElement('urgent-flights')
export class UrgentFlights extends LitElement {
  @state()
  private flights: Flight[] = [];

  @state()
  private loading = true;

  @state()
  private viewMode: 'urgent' |/** Estado interno que determina el esquema visual y los datos de la tabla según la gravedad */
   'upcoming' = 'urgent';

  static styles = css`
    :host {
      display: block;
      margin-top: 2rem;
      background-color: var(--card-bg);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid rgba(128, 128, 128, 0.15);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      color: var(--text-color);
    }

    h2 {
      margin-top: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .urgent-title {
      color: var(--error-color);
    }
    .upcoming-title {
      color: var(--primary-color);
    }
    .badge.scheduled {
      background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
      color: var(--primary-color);
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th, td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(128, 128, 128, 0.1);
    }

    th {
      font-size: 0.85rem;
      text-transform: uppercase;
      opacity: 0.7;
      font-weight: 600;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .flight-id {
      font-weight: bold;
      color: var(--primary-color);
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge.cancelled {
      background-color: color-mix(in srgb, var(--error-color) 15%, transparent);
      color: var(--error-color);
    }

    .badge.delayed {
      background-color: color-mix(in srgb, #f59e0b 15%, transparent);
      color: #d97706; /* Amber para retrasos */
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      opacity: 0.6;
      font-style: italic;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    try {
      const urgent = await flightService.getUrgentFlights();
      if (urgent.length > 0) {
        this.flights = urgent;
        this.viewMode = 'urgent';
      } else {
        this.flights = await flightService.getUpcomingFlights(5);
        this.viewMode = 'upcoming';
      }
    } catch (e) {
      console.error('Failed to load flights', e);
    } finally {
      this.loading = false;
    }
  }

  render() {
    const isUrgent = this.viewMode === 'urgent';
    
    return html`
      <h2 class="${isUrgent ? 'urgent-title' : 'upcoming-title'}">
        ${isUrgent 
          ? html`<ph-warning weight="duotone"></ph-warning> Atención Requerida (Vuelos Urgentes)`
          : html`<ph-airplane-takeoff weight="duotone"></ph-airplane-takeoff> Próximos Vuelos Programados`
        }
      </h2>
      
      ${this.loading 
        ? html`<div class="empty-state">Cargando...</div>` 
        : this.flights.length === 0 
          ? html`<div class="empty-state">No hay vuelos para mostrar.</div>`
          : html`
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    ${!isUrgent ? html`<th>Hora</th>` : ''}
                    <th>Vuelo</th>
                    <th>Ruta</th>
                    <th>Aerolínea</th>
                    <th>Estado</th>
                    ${isUrgent ? html`<th>Retraso (min)</th>` : ''}
                  </tr>
                </thead>
                <tbody>
                  ${this.flights.map(f => {
                    const isCancelled = f.flight_status === 'cancelled';
                    const isScheduled = f.flight_status === 'scheduled';
                    const delay = f.departure?.delay || 0;
                    
                    let timeStr = '-';
                    if (!isUrgent && f.departure?.scheduled) {
                        const date = new Date(f.departure.scheduled);
                        timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    }
                    
                    return html`
                      <tr>
                        ${!isUrgent ? html`
                           <td style="font-weight: 600; color: var(--text-color);">
                             <ph-clock style="vertical-align: text-bottom; margin-right: 4px; opacity: 0.7;"></ph-clock>
                             ${timeStr}
                           </td>
                        ` : ''}
                        <td class="flight-id">${f.flight.iata}</td>
                        <td class="route">
                          ${f.departure.iata} 
                          <ph-arrow-right weight="bold" style="vertical-align: middle; margin: 0 4px;"></ph-arrow-right> 
                          ${f.arrival.iata}
                        </td>
                        <td>${f.airline.name}</td>
                        <td>
                          <span class="badge ${isCancelled ? 'cancelled' : isScheduled ? 'scheduled' : 'delayed'}">
                            ${isCancelled ? 'Cancelado' : isScheduled ? 'Programado' : 'Retrasado'}
                          </span>
                        </td>
                        ${isUrgent ? html`<td>${delay > 0 ? `+${delay}` : '-'}</td>` : ''}
                      </tr>
                    `;
                  })}
                </tbody>
              </table>
            </div>
          `
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'urgent-flights': UrgentFlights;
  }
}
