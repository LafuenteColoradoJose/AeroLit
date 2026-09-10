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

@customElement('live-map')
export class LiveMap extends LitElement {
  @query('#map')
  private mapElement!: HTMLElement;

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];

  @state()
  private loading = true;

  static styles = [
    css`
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
        font-size: 1.25rem;
        margin-bottom: 1.5rem;
        opacity: 0.9;
      }

      #map {
        height: 400px;
        width: 100%;
        border-radius: 8px;
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
    `
  ];

  async firstUpdated() {
    this.initMap();
    await this.loadFlights();
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
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap() {
    // Inicializamos centrado en el Atlántico / Europa
    this.map = L.map(this.mapElement).setView([45.0, -10.0], 3);

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
        livePlanes.forEach(plane => this.addPlaneToMap(plane));
      }
    } catch (error) {
      console.error('Error al cargar vuelos para el mapa', error);
    } finally {
      this.loading = false;
    }
  }

  private addPlaneToMap(plane: any) {
    if (!this.map) return;

    // Crear un icono personalizado más pequeño para no saturar el mapa
    const airplaneHtml = `<div style="transform: rotate(${plane.direction}deg); font-size: 14px; color: #1e3a8a; opacity: 0.85; text-shadow: 0 0 2px white;"><ph-airplane-in-flight weight="fill"></ph-airplane-in-flight></div>`;
    const airplaneIcon = L.divIcon({
      html: airplaneHtml,
      className: 'plane-icon',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
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
        Mapa de Vuelos en Vivo
      </h2>
      <div style="position: relative;">
        ${this.loading ? html`<div class="empty-state" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1000; background: var(--bg-color); display: flex; align-items: center; justify-content: center;">Cargando mapa...</div>` : ''}
        <div id="map"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'live-map': LiveMap;
  }
}
