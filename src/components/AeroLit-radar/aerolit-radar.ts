import { LitElement, html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import * as L from 'leaflet';
import { flightService } from '../../services/flight-service';
import type { Flight } from '../../models/flight';
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

    await this.loadFlights();

    // Actualizar cada 60 segundos
    this.updateInterval = window.setInterval(async () => {
      // Usar Page Visibility API para no consumir peticiones si la pestaña está oculta
      if (!document.hidden) {
        await this.loadFlights();
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

  
  private async loadFlights() {
    try {
      this.loading = true;
      // Usamos OpenSky Network para obtener aviones reales sobre España en vez de Aviationstack
      const livePlanes = await flightService.getLivePlanes();
      
      if (this.map) {
        // Limpiar marcadores antiguos antes de repintar
        this.markers.forEach(m => m.remove());
        this.markers = [];
        
        livePlanes.forEach(plane => this.addPlaneToMap(plane));
      }

    } catch (error) {
      console.error('Error al cargar vuelos para el mapa', error);
    } finally {
      this.loading = false;
    }
  }

  
  private getPlaneColor(altitude: number): string {
    if (altitude < 5000) return '#facc15'; // Amarillo (Despegue/Aterrizaje)
    if (altitude < 15000) return '#4ade80'; // Verde
    if (altitude < 25000) return '#38bdf8'; // Azul claro (Ascenso/Descenso)
    if (altitude < 35000) return '#3b82f6'; // Azul oscuro (Crucero normal)
    return '#a855f7'; // Morado/Púrpura (Crucero muy alto, >35,000 pies)
  }

  private addPlaneToMap(plane: any) {
    if (!this.map) return;

    // Crear un icono personalizado más pequeño para no saturar el mapa
    const airplaneHtml = `
      <div class="ripple-effect" style="transform: rotate(${plane.direction}deg); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.4));">
        <svg viewBox="0 0 21 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
          <path fill="${this.getPlaneColor(plane.altitude)}" stroke="#1e293b" stroke-width="1.5" stroke-linejoin="round"
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

    const marker = L.marker([plane.latitude, plane.longitude], { icon: airplaneIcon })
      .addTo(this.map)
      .bindPopup(`
        <strong>Vuelo: ${plane.callsign}</strong><br>
        País: ${plane.country}<br>
        Altitud: ${plane.altitude} ft<br>
        Velocidad: ${plane.velocity} km/h
      `);

    this.markers.push(marker);
  }

  render() {
    return html`
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <h2>
        <ph-globe-hemisphere-west weight="bold"></ph-globe-hemisphere-west>
        Radar de Vuelos en Vivo
      </h2>
      
      <div class="map-container">
        ${this.loading ? html`<div class="empty-state" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1001; background: var(--bg-color); display: flex; align-items: center; justify-content: center;">Cargando radar...</div>` : ''}
        
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
