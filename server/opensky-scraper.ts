/**
 * @file opensky-scraper.ts
 * @description Motor de extracción de datos del radar (OpenSky Network) en memoria RAM.
 * Descarga las posiciones de los aviones sobre España periódicamente para
 * evitar el rate-limit de la API pública y servir los datos instantáneamente al frontend.
 */

import https from 'https';

export class OpenSkyScraper {
  /** @private Caché en memoria para las posiciones de los aviones */
  private inMemoryPlanes: any = { states: [] };
  
  /** @private Almacena el timestamp de la última extracción exitosa */
  private lastFetchTime: Date | null = null;
  
  /** @private ID del temporizador para el polling continuo */
  private intervalId: NodeJS.Timeout | null = null;
  
  /** 
   * @private Bounding box aproximado para la península ibérica y Canarias 
   * (Latitudes: 35.0 a 44.0 | Longitudes: -10.0 a 5.0)
   */
  private readonly URL = '/api/states/all?lamin=35.0&lomin=-10.0&lamax=44.0&lomax=5.0';

  /**
   * @constructor
   * Inicializa el motor de extracción y configura un bucle infinito que 
   * actualiza el mapa del espacio aéreo cada 15 segundos de forma silenciosa.
   */
  constructor() {
    this.scrapeRadar();
    
    // Ejecuta cada 15 segundos para dar un tiempo real fluido sin saturar la red pública
    this.intervalId = setInterval(() => {
      this.scrapeRadar();
    }, 15 * 1000);
  }

  /**
   * Detiene el motor de extracción de OpenSky Network.
   * Útil para liberar memoria y evitar memory leaks durante el ciclo de vida de tests.
   * @public
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Devuelve el payload actual (caché en RAM) del espacio aéreo ibérico.
   * @returns {Object} JSON con metadatos de la última actualización y el array de vectores.
   * @public
   */
  public getPlanes() {
    return {
      lastUpdate: this.lastFetchTime,
      data: this.inMemoryPlanes
    };
  }

  /**
   * Ejecuta una petición HTTPS nativa servidor-a-servidor contra OpenSky Network.
   * Gestiona errores de red, JSONs corruptos y previene bloqueos temporales (Timeouts).
   * @private
   */
  private scrapeRadar(): void {
    const options = {
      hostname: 'opensky-network.org',
      port: 443,
      path: this.URL,
      method: 'GET',
      headers: {
        'User-Agent': 'AeroLit-Backend/1.0',
        'Accept': 'application/json'
      },
      timeout: 8000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            this.inMemoryPlanes = json;
            this.lastFetchTime = new Date();
          } catch (e) {
            console.error('[Radar] Error parseando JSON de OpenSky');
          }
        }
      });
    });

    req.on('error', (e) => {
      console.error(`[Radar] Error de red: ${e.message}`);
    });
    
    req.on('timeout', () => {
      req.destroy();
    });

    req.end();
  }
}

/** 
 * Singleton exportado que mantiene la instancia única del scraper global
 * @type {OpenSkyScraper} 
 */
export const openskyInstance = new OpenSkyScraper();
