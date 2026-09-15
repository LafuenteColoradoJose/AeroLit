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
  
  /** 
   * @private Bounding box aproximado para la península ibérica y Canarias 
   * (Latitudes: 35.0 a 44.0 | Longitudes: -10.0 a 5.0)
   */
  private readonly URL = '/api/states/all?lamin=35.0&lomin=-10.0&lamax=44.0&lomax=5.0';

  /**
   * @constructor
   */
  constructor() {
    // En entornos Serverless, evitamos setInterval. Haremos Lazy Fetching.
  }

  /**
   * Detiene el motor (Compatibilidad hacia atrás para tests)
   * @public
   */
  public stop(): void {
    // Ya no hay intervalo que detener
  }

  /**
   * Devuelve el payload actual del espacio aéreo ibérico.
   * Si la caché tiene más de 10 segundos o está vacía, refresca de forma asíncrona.
   * @returns {Promise<Object>} JSON con metadatos de la última actualización y el array de vectores.
   * @public
   */
  public async getPlanes(): Promise<any> {
    const now = new Date();
    const cacheAge = this.lastFetchTime ? now.getTime() - this.lastFetchTime.getTime() : Infinity;

    // Si la caché es más antigua de 10 segundos, forzamos un refresco (Lazy Fetching Serverless)
    if (cacheAge > 10000) {
      await this.scrapeRadar();
    }

    return {
      lastUpdate: this.lastFetchTime,
      data: this.inMemoryPlanes
    };
  }

  /**
   * Ejecuta una petición HTTPS nativa servidor-a-servidor contra OpenSky Network.
   * Devuelve una Promesa para poder hacer await en entornos Serverless (Vercel).
   * @private
   */
  private scrapeRadar(): Promise<void> {
    return new Promise((resolve) => {
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
          resolve(); // Resolvemos siempre, incluso si falla, para devolver la caché vieja
        });
      });

      req.on('error', (e) => {
        console.error(`[Radar] Error de red: ${e.message}`);
        resolve();
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve();
      });

      req.end();
    });
  }
}

/** 
 * Singleton exportado que mantiene la instancia única del scraper global
 * @type {OpenSkyScraper} 
 */
export const openskyInstance = new OpenSkyScraper();
