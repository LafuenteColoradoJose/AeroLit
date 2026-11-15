import { LitElement, html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import * as L from 'leaflet';
import { flightService } from '../../services/flight-service';
import '@phosphor-icons/webcomponents/PhGlobeHemisphereWest';

// Arreglo para los iconos por defecto de Leaflet en Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

@customElement('aerolit-radar')
export class AerolitRadar extends LitElement {
  @query('#map')
  private mapElement!: HTMLElement;

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private updateInterval: number | null = null;

  @state()
  private loading = true;

  /** Mensaje de error visible cuando el radar no puede obtener datos y no hay caché. */
  @state()
  private error: string | null = null;

  /** Número de aeronaves actualmente pintadas en el mapa. */
  @state()
  private planeCount = 0;

  /** Hora de la última actualización correcta del radar. */
  @state()
  private lastUpdate: Date | null = null;

  static styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background-color: var(--bg-color);
        color: var(--text-color);
        padding: 1.5rem;
      }
      
      @media (max-width: 768px) {
        :host {
          padding: 1rem;
        }
        h2 {
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }
        box-sizing: border-box;
      }

      h2 {
        margin-top: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
        opacity: 0.9;
      }

      .map-container {
        flex: 1;
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid rgba(128, 128, 128, 0.15);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      }

      #map {
        height: 100%;
        width: 100%;
        z-index: 1; /* Para no tapar otros elementos */
      }

      .empty-state {
        text-align: center;
        padding: 2rem;
        opacity: 0.6;
        font-style: italic;
      }

      /* Barra de estado superpuesta al mapa */
      .radar-status {
        position: absolute;
        top: 16px;
        left: 16px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: 999px;
        background: var(--bg-color, #ffffff);
        color: var(--text-color, #1e293b);
        border: 1px solid rgba(128, 128, 128, 0.15);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        font-size: 0.85rem;
        font-weight: 600;
        backdrop-filter: blur(8px);
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #4ade80;
        box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.2);
      }

      .status-dot.offline {
        background: #f15152;
        box-shadow: 0 0 0 3px rgba(241, 81, 82, 0.2);
      }

      /* Aviso de error con reintento manual */
      .radar-alert {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        margin-bottom: 1rem;
        border-radius: 10px;
        border: 1px solid rgba(241, 81, 82, 0.35);
        background: rgba(241, 81, 82, 0.12);
        color: var(--text-color, #1e293b);
        font-size: 0.9rem;
      }

      .radar-alert button {
        flex-shrink: 0;
        border: 0;
        border-radius: 8px;
        padding: 6px 12px;
        background: var(--primary-color, #1e555c);
        color: #ffffff;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }

      .radar-alert button:hover {
        filter: brightness(1.1);
      }

      .radar-alert button:focus-visible {
        outline: 2px solid var(--primary-color, #1e555c);
        outline-offset: 2px;
      }
      /* Rotación personalizada del avión */
      .plane-icon {
        transition: transform 0.3s;
      }

      
      /* Animación Ripple de sincronización */
      @keyframes radar-ripple {
        0% {
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.8);
        }
        70% {
          box-shadow: 0 0 0 15px rgba(255, 255, 255, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
        }
      }

      .ripple-effect {
        animation: radar-ripple 1.5s cubic-bezier(0.16, 1, 0.3, 1);
        border-radius: 50%; /* Para que la onda expansiva sea circular */
      }

      .radar-legend {
        position: absolute;
        bottom: 25px;
        right: 25px;
        background: var(--bg-color, #ffffff);
        color: var(--text-color, #1e293b);
        padding: 12px 16px;
        border-radius: 10px;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        z-index: 1000; /* Leaflet UI is typically around 400-1000 */
        font-size: 0.85rem;
        border: 1px solid rgba(128, 128, 128, 0.15);
        backdrop-filter: blur(8px);
      }

      .radar-legend h4 {
        margin: 0 0 10px 0;
        font-size: 0.85rem;
        font-weight: 700;
        opacity: 0.9;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;
        opacity: 0.85;
      }
      
      .legend-item:last-child {
        margin-bottom: 0;
      }

      .color-box {
        width: 14px;
        height: 14px;
        border-radius: 4px;
        display: inline-block;
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
      }

    `
  ];

  
  async firstUpdated() {
    this.initMap();

    // Observar cambios de tamaño en el contenedor para recalcular el mapa (p.ej. al colapsar el sidebar)
    this.resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    });
    this.resizeObserver.observe(this.mapElement);

    await this.loadFlights(true);

    // Actualizar cada 60 segundos sin volver a mostrar el overlay de carga
    this.updateInterval = window.setInterval(() => {
      // Usar Page Visibility API para no consumir peticiones si la pestaña está oculta
      if (!document.hidden) {
        void this.loadFlights(false);
      }
    }, 60000);
  }


  updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties);
    if (this.map) {
      // Forzamos a leaflet a recalcular su tamaño por si cargó estando oculto o sin CSS
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 100);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap() {
    // Inicializamos centrado en el Atlántico / Europa
    this.map = L.map(this.mapElement).setView([39.5, -3.0], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);
  }

  
  private async loadFlights(showLoading: boolean = false) {
    if (showLoading) {
      this.loading = true;
    }

    try {
      const livePlanes = await flightService.getLivePlanes();

      if (this.map) {
        // Limpiar marcadores antiguos antes de repintar
        this.markers.forEach(m => m.remove());
        this.markers = [];

        livePlanes.forEach(plane => this.addPlaneToMap(plane));
      }

      this.planeCount = livePlanes.length;
      this.lastUpdate = new Date();
      this.error = null;

    } catch (error) {
      console.error('Error al cargar vuelos para el mapa', error);
      this.error = 'No se ha podido conectar con el radar de vuelos.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Reintenta manualmente la carga del radar tras un error.
   *
   * @private
   */
  private retry() {
    void this.loadFlights(true);
  }

  private getPlaneColor(altitude: number): string {
    if (!Number.isFinite(altitude) || altitude < 5000) return '#facc15'; // Amarillo (Despegue/Aterrizaje)
    if (altitude < 15000) return '#4ade80'; // Verde
    if (altitude < 25000) return '#38bdf8'; // Azul claro (Ascenso/Descenso)
    if (altitude < 35000) return '#3b82f6'; // Azul oscuro (Crucero normal)
    return '#a855f7'; // Morado/Púrpura (Crucero muy alto, >35,000 pies)
  }

  private addPlaneToMap(plane: any) {
    if (!this.map) return;

    const latitude = Number(plane.latitude);
    const longitude = Number(plane.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const direction = Number.isFinite(Number(plane.direction)) ? Number(plane.direction) : 0;
    const altitude = Number.isFinite(Number(plane.altitude)) ? Number(plane.altitude) : 0;
    const velocity = Number.isFinite(Number(plane.velocity)) ? Number(plane.velocity) : 0;
    const callsign = this.escapeHtml(plane.callsign || 'Desconocido');
    const country = this.escapeHtml(plane.country || 'Desconocido');

    // Crear un icono personalizado más pequeño para no saturar el mapa
    const airplaneHtml = `
      <div class="ripple-effect" style="transform: rotate(${direction}deg); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.4));">
        <svg viewBox="0 0 21 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
          <path fill="${this.getPlaneColor(altitude)}" stroke="#1e293b" stroke-width="1.5" stroke-linejoin="round"
            d="M21,16v-2l-8-5V3.5C13,2.12 11.88,1 10.5,1S8,2.12 8,3.5V9L0,14v2l8-2.5V19l-2,1.5V22l3.5-1l3.5,1v-1.5L13,19v-5.5L21,16z" />
        </svg>
      </div>
    `;
    const airplaneIcon = L.divIcon({
      html: airplaneHtml,
      className: 'plane-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([latitude, longitude], { icon: airplaneIcon })
      .addTo(this.map)
      .bindPopup(`
        <strong>Vuelo: ${callsign}</strong><br>
        País: ${country}<br>
        Altitud: ${altitude.toLocaleString('es-ES')} ft<br>
        Velocidad: ${velocity.toLocaleString('es-ES')} km/h
      `);

    this.markers.push(marker);
  }

  /**
   * Escapa texto procedente de una API externa antes de insertarlo como HTML
   * en el popup de Leaflet, evitando inyección de marcado.
   *
   * @private
   * @param {unknown} value - Valor a escapar.
   * @returns {string} Texto seguro para interpolar en HTML.
   */
  private escapeHtml(value: unknown): string {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return String(value).replace(/[&<>"']/g, char => replacements[char]);
  }

  render() {
    const statusLabel = `${this.planeCount} ${this.planeCount === 1 ? 'aeronave' : 'aeronaves'}`;
    const showEmpty = !this.loading && !this.error && this.planeCount === 0;

    return html`
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <h2>
        <ph-globe-hemisphere-west weight="bold"></ph-globe-hemisphere-west>
        Radar de Vuelos en Vivo
      </h2>

      ${this.error ? html`
        <div class="radar-alert" role="alert">
          <span>${this.error}</span>
          <button type="button" @click=${this.retry}>Reintentar</button>
        </div>
      ` : ''}

      <div class="map-container">
        ${this.loading ? html`<div class="empty-state" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1001; background: var(--bg-color); display: flex; align-items: center; justify-content: center;">Cargando radar...</div>` : ''}

        ${showEmpty ? html`<div class="empty-state" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1001; background: var(--bg-color); display: flex; align-items: center; justify-content: center;">No hay aeronaves disponibles en este momento.</div>` : ''}

        <!-- Estado de la última sincronización -->
        <div class="radar-status" aria-live="polite">
          <span class="status-dot ${this.error ? 'offline' : ''}"></span>
          ${statusLabel}
          ${this.lastUpdate ? html` · ${this.lastUpdate.toLocaleTimeString('es-ES')}` : ''}
        </div>

        <!-- Leyenda de colores -->
        <div class="radar-legend">
          <h4>Altitud (pies)</h4>
          <div class="legend-item"><span class="color-box" style="background: #a855f7;"></span> &gt; 35,000</div>
          <div class="legend-item"><span class="color-box" style="background: #3b82f6;"></span> 25k - 35k</div>
          <div class="legend-item"><span class="color-box" style="background: #38bdf8;"></span> 15k - 25k</div>
          <div class="legend-item"><span class="color-box" style="background: #4ade80;"></span> 5k - 15k</div>
          <div class="legend-item"><span class="color-box" style="background: #facc15;"></span> &lt; 5,000</div>
        </div>

        <div id="map"></div>

      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'aerolit-radar': AerolitRadar;
  }
}
