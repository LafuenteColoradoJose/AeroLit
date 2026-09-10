import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { Flight } from '../../models/flight';
import { flightService } from '../../services/flight-service';
import '@phosphor-icons/webcomponents/PhWarning';

@customElement('urgent-flights')
export class UrgentFlights extends LitElement {
  @state()
  private flights: Flight[] = [];

  @state()
  private loading = true;

  static styles = css`
    :host {
      display: block;
      margin-top: 2rem;
      background-color: var(--bg-color);
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
      color: var(--error-color);
      font-size: 1.25rem;
      margin-bottom: 1.5rem;
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
      this.flights = await flightService.getUrgentFlights();
    } catch (e) {
      console.error('Failed to load urgent flights', e);
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <h2>
        <ph-warning weight="duotone"></ph-warning>
        Atención Requerida (Vuelos Urgentes)
      </h2>
      
      ${this.loading 
        ? html`<div class="empty-state">Cargando...</div>` 
        : this.flights.length === 0 
          ? html`<div class="empty-state">No hay vuelos urgentes en este momento.</div>`
          : html`
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Vuelo</th>
                    <th>Ruta</th>
                    <th>Aerolínea</th>
                    <th>Estado</th>
                    <th>Retraso (min)</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.flights.map(f => {
                    const isCancelled = f.flight_status === 'cancelled';
                    const delay = f.departure?.delay || 0;
                    return html`
                      <tr>
                        <td class="flight-id">${f.flight.iata}</td>
                        <td>${f.departure.iata} ➔ ${f.arrival.iata}</td>
                        <td>${f.airline.name}</td>
                        <td>
                          <span class="badge ${isCancelled ? 'cancelled' : 'delayed'}">
                            ${isCancelled ? 'Cancelado' : 'Retrasado'}
                          </span>
                        </td>
                        <td>${delay > 0 ? `+${delay}` : '-'}</td>
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
