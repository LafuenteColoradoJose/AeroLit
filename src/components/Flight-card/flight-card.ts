import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Flight } from '../../models/flight';
import '@phosphor-icons/webcomponents/PhAirplaneTilt';

@customElement('flight-card')
export class FlightCard extends LitElement {
  
  @property({ type: Object })
  flight?: Flight;

  static styles = css`
    :host {
      display: block;
      background-color: var(--card-bg);
      border: 1px solid var(--primary-color);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 6px rgba(58, 46, 57, 0.1); /* Usando Shadow Grey con opacidad */
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      color: var(--text-color);
    }

    :host(:hover) {
      transform: translateY(-4px);
      box-shadow: 0 6px 12px rgba(58, 46, 57, 0.2);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px dashed var(--secondary-color);
      padding-bottom: 8px;
    }

    .airline {
      font-weight: bold;
      font-size: 1.1rem;
      color: var(--primary-color);
    }

    .status {
      font-size: 0.8rem;
      text-transform: uppercase;
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 12px;
      background-color: var(--secondary-color);
      color: var(--text-color); /* Mejor contraste que el bg-color */
    }

    .status.cancelled {
      background-color: var(--error-color);
      color: var(--c-white); /* Blanco/claro sobre rojo se lee bien */
    }
    
    .status.active {
      background-color: var(--primary-color);
      color: var(--c-white); /* Blanco/claro sobre primario (oscuro) se lee bien */
    }

    .route {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .airport {
      text-align: center;
    }

    .iata {
      font-size: 1.5rem;
      font-weight: 900;
      color: var(--text-color);
    }

    .city {
      font-size: 0.75rem;
      opacity: 0.8;
      max-width: 100px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .plane-icon {
      color: var(--primary-color);
      margin: 0 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    ph-airplane-tilt {
      font-size: 2rem;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
    }

    .time-block {
      display: flex;
      flex-direction: column;
    }

    .time-label {
      font-size: 0.7rem;
      opacity: 0.7;
      text-transform: uppercase;
    }

    .time-value {
      font-weight: bold;
    }
  `;

  // Helper para formatear la fecha/hora
  private formatTime(dateString: string) {
    if (!dateString) return '--:--';
    const d = new Date(dateString);
    const date = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `${date} - ${time}`;
  }

  render() {
    if (!this.flight || !this.flight.airline) return html``;

    const statusClass = this.flight.flight_status === 'cancelled' 
      ? 'cancelled' 
      : this.flight.flight_status === 'active' ? 'active' : '';

    return html`
      <div class="header">
        <div class="airline">
          ${this.flight.airline.name} 
          <span style="font-size: 0.9rem; font-weight: 600; color: var(--text-color); opacity: 0.85; margin-left: 6px;">(${this.flight.flight.iata})</span>
        </div>
        <div class="status ${statusClass}">${this.flight.flight_status}</div>
      </div>

      <div class="route">
        <div class="airport">
          <div class="iata">${this.flight.departure.iata}</div>
          <div class="city" title="${this.flight.departure.airport}">${this.flight.departure.airport}</div>
        </div>
        
        <div class="plane-icon">
          <ph-airplane-tilt weight="duotone"></ph-airplane-tilt>
        </div>
        
        <div class="airport">
          <div class="iata">${this.flight.arrival.iata}</div>
          <div class="city" title="${this.flight.arrival.airport}">${this.flight.arrival.airport}</div>
        </div>
      </div>

      <div class="footer">
        <div class="time-block">
          <span class="time-label">Salida</span>
          <span class="time-value">${this.formatTime(this.flight.departure.scheduled)}</span>
        </div>
        <div class="time-block" style="text-align: right;">
          <span class="time-label">Llegada (Est.)</span>
          <span class="time-value">${this.formatTime(this.flight.arrival.estimated)}</span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flight-card': FlightCard;
  }
}
