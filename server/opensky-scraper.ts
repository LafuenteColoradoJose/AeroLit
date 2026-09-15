import https from 'https';

export class OpenSkyScraper {
  private inMemoryPlanes: any = { states: [] };
  private lastFetchTime: Date | null = null;
  
  // Usamos ADSB.lol (Gratis, Sin bloqueos a Vercel, Cobertura global)
  // Radio de 400NM (~740km) centrado en Madrid cubre toda España y parte de Europa/Norte de África
  private readonly URL = '/v2/lat/40/lon/-3/dist/400';

  constructor() {}

  public stop(): void {}

  public async getPlanes(): Promise<any> {
    const now = new Date();
    const cacheAge = this.lastFetchTime ? now.getTime() - this.lastFetchTime.getTime() : Infinity;

    if (cacheAge > 10000) {
      await this.scrapeRadar();
    }

    return {
      lastUpdate: this.lastFetchTime,
      data: this.inMemoryPlanes
    };
  }

  private scrapeRadar(): Promise<void> {
    return new Promise((resolve) => {
      const options = {
        hostname: 'api.adsb.lol',
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
              
              // Mapeamos el formato de ADSB.lol al formato de OpenSky para no romper el frontend
              const mappedStates = (json.ac || []).map((ac: any) => {
                 return [
                   ac.hex || '000000', // 0: icao24
                   ac.flight || 'Desconocido', // 1: callsign
                   'España', // 2: origin_country (ADSB no lo da fácil, ponemos genérico o vacío)
                   null, // 3: time_position
                   null, // 4: last_contact
                   ac.lon, // 5: longitude
                   ac.lat, // 6: latitude
                   ac.alt_baro ? ac.alt_baro / 3.28084 : 0, // 7: altitude en metros (frontend lo pasa a pies)
                   false, // 8: on_ground
                   ac.gs ? ac.gs * 0.514444 : 0, // 9: velocidad m/s (frontend lo pasa a km/h)
                   ac.track || 0, // 10: true_track
                   0 // 11: vertical_rate
                 ];
              });

              this.inMemoryPlanes = { states: mappedStates };
              this.lastFetchTime = new Date();
            } catch (e) {
              console.error('[Radar] Error parseando JSON de ADSB.lol');
            }
          }
          resolve(); 
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

export const openskyInstance = new OpenSkyScraper();
