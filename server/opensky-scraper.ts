import https from 'https';

/**
 * Centro geográfico desde el que se consulta ADSB.lol, expresado en grados decimales.
 *
 * @interface RadarCenter
 */
export interface RadarCenter {
  /** Latitud del centro de búsqueda. */
  lat: number;
  /** Longitud del centro de búsqueda. */
  lon: number;
}

/**
 * Centros consultados en paralelo para cubrir toda España.
 *
 * ADSB.lol limita cada consulta a un radio máximo de 250 millas náuticas,
 * por lo que un único punto centrado en Madrid deja fuera Galicia y Canarias.
 * Cada centro aporta su propia cobertura y los resultados se deduplican por `hex`.
 */
export const RADAR_CENTERS: RadarCenter[] = [
  { lat: 40.0, lon: -3.0 }, // Madrid y centro peninsular
  { lat: 41.39, lon: 2.17 }, // Barcelona, Cataluña y Baleares
  { lat: 37.39, lon: -5.98 }, // Sevilla y Andalucía occidental
  { lat: 42.88, lon: -8.54 }, // Santiago, Galicia y cornisa cantábrica
  { lat: 28.1, lon: -15.4 }, // Canarias
];

/** Radio máximo aceptado actualmente por ADSB.lol, en millas náuticas. */
export const RADAR_RADIUS_NM = 250;

/** Tiempo de vida de la caché en memoria, en milisegundos. */
const CACHE_TTL_MS = 10_000;

/** Timeout máximo de cada petición a ADSB.lol, en milisegundos. */
const REQUEST_TIMEOUT_MS = 5_000;

/** Cabeceras enviadas en cada petición a ADSB.lol. */
const REQUEST_HEADERS = {
  'User-Agent': 'AeroLit-Backend/1.0',
  Accept: 'application/json',
};

/**
 * Estado de aeronave normalizado al formato que ya consume el frontend (estilo OpenSky).
 * Se mantiene el array posicional para no romper la interfaz existente del radar.
 */
export type AircraftState = any[];

/**
 * Motor de extracción de posiciones de aeronaves para el radar.
 *
 * Aunque conserva el nombre histórico `OpenSkyScraper` por compatibilidad, la fuente
 * de datos actual es ADSB.lol. El servicio consulta varios centros en paralelo,
 * deduplica por identificador ICAO y conserva el último snapshot válido si una
 * consulta falla, evitando dejar el radar vacío por un error puntual.
 *
 * @class OpenSkyScraper
 */
export class OpenSkyScraper {
  /** Último snapshot válido de aeronaves en memoria. */
  private inMemoryPlanes: { states: AircraftState[] } = { states: [] };

  /** Fecha del último snapshot válido obtenido de ADSB.lol. */
  private lastFetchTime: Date | null = null;

  /** Fecha del último intento de actualización, para evitar ráfagas de peticiones. */
  private lastAttemptTime = 0;

  /** Promesa de la actualización en curso, para evitar consultas concurrentes. */
  private inFlightFetch: Promise<void> | null = null;

  /**
   * Detiene el motor. Se mantiene por compatibilidad con la interfaz anterior.
   */
  public stop(): void {
    // No hay procesos en segundo plano que detener (estrategia lazy en Serverless).
  }

  /**
   * Devuelve el último snapshot disponible, refrescándolo si la caché ha caducado.
   *
   * @returns {Promise<{ lastUpdate: Date | null; data: { states: AircraftState[] } }>}
   * Snapshot de aeronaves junto a la fecha de la última lectura válida.
   */
  public async getPlanes(): Promise<{ lastUpdate: Date | null; data: { states: AircraftState[] } }> {
    const cacheAge = this.lastAttemptTime ? Date.now() - this.lastAttemptTime : Infinity;

    if (cacheAge > CACHE_TTL_MS) {
      await this.refresh();
    }

    return {
      lastUpdate: this.lastFetchTime,
      data: this.inMemoryPlanes,
    };
  }

  /**
   * Ejecuta una actualización, reutilizando la petición en curso si ya hay una activa.
   *
   * @private
   * @returns {Promise<void>} Promesa que resuelve al terminar la actualización.
   */
  private async refresh(): Promise<void> {
    if (!this.inFlightFetch) {
      this.lastAttemptTime = Date.now();
      this.inFlightFetch = this.scrapeRadar().finally(() => {
        this.inFlightFetch = null;
      });
    }

    await this.inFlightFetch;
  }

  /**
   * Consulta todos los centros en paralelo, deduplica las aeronaves por `hex`
   * y actualiza el snapshot en memoria solo si se ha obtenido algún dato válido.
   *
   * @private
   * @returns {Promise<void>} Promesa que resuelve al finalizar el barrido.
   */
  private async scrapeRadar(): Promise<void> {
    const responses = await Promise.all(RADAR_CENTERS.map((center) => this.fetchCenter(center)));

    const uniqueAircraft = new Map<string, any>();
    for (const aircraft of responses.flat()) {
      const hex = typeof aircraft?.hex === 'string' ? aircraft.hex.trim() : '';
      if (!hex || uniqueAircraft.has(hex)) continue;
      uniqueAircraft.set(hex, aircraft);
    }

    const states = [...uniqueAircraft.values()]
      .map((aircraft) => this.toOpenSkyState(aircraft))
      .filter((state): state is AircraftState => state !== null);

    if (states.length > 0) {
      this.inMemoryPlanes = { states };
      this.lastFetchTime = new Date();
      return;
    }

    console.warn('[Radar] ADSB.lol no devolvió aeronaves; se conserva el último snapshot válido.');
  }

  /**
   * Realiza una petición GET a un centro concreto de ADSB.lol.
   *
   * @private
   * @param {RadarCenter} center - Centro geográfico de la consulta.
   * @returns {Promise<any[]>} Lista cruda de aeronaves o array vacío si falla.
   */
  private fetchCenter(center: RadarCenter): Promise<any[]> {
    return new Promise((resolve) => {
      const path = `/v2/lat/${center.lat}/lon/${center.lon}/dist/${RADAR_RADIUS_NM}`;
      const options = {
        hostname: 'api.adsb.lol',
        port: 443,
        path,
        method: 'GET',
        headers: REQUEST_HEADERS,
        timeout: REQUEST_TIMEOUT_MS,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            const detail = data.slice(0, 120);
            console.error(
              `[Radar] ADSB.lol respondió ${res.statusCode} en ${path}${detail ? `: ${detail}` : ''}`,
            );
            resolve([]);
            return;
          }

          try {
            const json = JSON.parse(data);
            resolve(Array.isArray(json.ac) ? json.ac : []);
          } catch {
            console.error('[Radar] Error parseando JSON de ADSB.lol');
            resolve([]);
          }
        });
      });

      req.on('error', (error: Error) => {
        console.error(`[Radar] Error de red: ${error.message}`);
        resolve([]);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });

      req.end();
    });
  }

  /**
   * Transforma una aeronave de ADSB.lol al array posicional estilo OpenSky
   * que espera `flightService.getLivePlanes()`.
   *
   * @private
   * @param {any} aircraft - Aeronave cruda devuelta por ADSB.lol.
   * @returns {AircraftState | null} Estado normalizado o `null` si no tiene coordenadas válidas.
   */
  private toOpenSkyState(aircraft: any): AircraftState | null {
    // `Number(null)` devuelve 0, por lo que descartamos nulos/indefinidos antes de convertir.
    if (aircraft?.lat == null || aircraft?.lon == null) {
      return null;
    }

    const latitude = Number(aircraft.lat);
    const longitude = Number(aircraft.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const isOnGround = aircraft?.alt_baro === 'ground' || aircraft?.on_ground === true;
    const altitudeFeet =
      typeof aircraft?.alt_baro === 'number' && Number.isFinite(aircraft.alt_baro)
        ? aircraft.alt_baro
        : 0;
    const groundSpeed = Number(aircraft?.gs);
    const track = Number(aircraft?.track);
    const callsign = typeof aircraft?.flight === 'string' ? aircraft.flight.trim() : '';

    return [
      aircraft?.hex || '000000', // 0: icao24
      callsign || 'Desconocido', // 1: callsign
      'España', // 2: origin_country
      null, // 3: time_position
      null, // 4: last_contact
      longitude, // 5: longitude
      latitude, // 6: latitude
      altitudeFeet / 3.28084, // 7: altitud en metros (el frontend la pasa a pies)
      isOnGround, // 8: on_ground
      Number.isFinite(groundSpeed) ? groundSpeed * 0.514444 : 0, // 9: velocidad en m/s
      Number.isFinite(track) ? track : 0, // 10: rumbo
      0, // 11: vertical_rate
    ];
  }
}

/** Instancia singleton utilizada por los endpoints serverless y el servidor local. */
export const openskyInstance = new OpenSkyScraper();
