/**
 * @file aena-scraper.ts
 * @description Motor de extracción de datos de AENA que opera en memoria RAM.
 * Este módulo realiza peticiones directamente a los endpoints satélite de AENA,
 * evadiendo restricciones básicas de CORS (al ejecutarse en entorno Node.js) y
 * provee datos normalizados al estándar de Aviationstack.
 */

import https from 'https';

const AIRPORTS = ["LCG","MAD","ABC","AEI","ALC","LEI","OVD","BJZ","BIO","RGS","ACE","JCU","ODB","VDE","GRX","FUE","GRO","LPA","HSK","IBZ","RMU","XRY","BCN","GMZ","SPC","LEN","RJL","MCV","AGP","MLN","MAH","PMI","PNA","REU","QSA","SLM","EAS","SCQ","SDR","SVQ","SBO","TFN","TFS","VLC","VLL","VGO","VIT","ZAZ"];

const headers = {
  'Accept': '*/*',
  'Accept-Language': 'es,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Content-Length': '0',
  'Cookie': 'OCIJSESSIONID=LLuMCPaOzFBN7bMi0lnDBX3u25rx3Mp5fL7WwlMCbzzx7Xldc8CZ!-1923888241!-147452165; ECIX_TECH_eCookies_cookie={"sv":"2/0/0","lang":"es","UID":"271503cf-9c7e-4d25-9cb8-467340e1484d","platforms":[{"platformId":"76e8853f-479f-4367-ad23-6ce1baa419d8","cookies":["SS_X_JSESSIONID","JSESSIONID","OptanonConsent","OptanonalertBoxClosed","s_cc","s_sq","AMCV_*","elixactivegroups","wpa_AppClick","token","apiDomain_","gac_","gig","glnk","glt_","gmid","gmSettings","gst","GSLM_","hasGmid","SAML_","gltexp_","ucid","AUTH_SESSION_ID","KEYCLOAK_","INGRESSCOOKIE","_hjid","^_ga*","^_gid*","^_gcl*","^_gat_UA-*","_hjIncludedInPageviewSample","_hjAbsoluteSessionInProgress","_hjTLDTest","^s_ecid$","^AMCV_","^s_cc$","^s_sq$","^s_vi$","^s_fid$","GoogleAdServingTest","test_cookie","^lang*","VISITOR_INFO1_LIVE","^__gads*","IDE","GPS","YSC","fr","^_fbp*","^_uetsid*","wfivefivec*","^_uetvid*","Pruebas"],"version":"58","discovery_mode":false,"block_mode":true}; elixactivegroups={"Cookies tÃ©cnicas (necesarias)":"1","Cookies analÃticas":"1","Cookies de Publicidad":"1","Cookies de PersonalizaciÃ³n":"1"}; AMCV_8170525A5488E08A0A4C98C6%40AdobeOrg=179643557%7CMCIDTS%7C20707%7CMCMID%7C56040868600055134489201827204331804983%7CMCAID%7CNONE%7CMCOPTOUT-1789063924s%7CNONE%7CvVersion%7C5.5.0; AMCVS_8170525A5488E08A0A4C98C6%40AdobeOrg=1; s_cc=true',
  'Host': 'www.aena.es',
  'Origin': 'https://www.aena.es',
  'Pragma': 'no-cache',
  'Referer': 'https://www.aena.es/es/infovuelos.html',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:155.0) Gecko/20100101 Firefox/155.0',
  'x-dtpc': '11$455791810_1'
};

/**
 * Realiza una petición POST al endpoint de información de vuelos de AENA.
 * 
 * @param {string} iata - Código IATA del aeropuerto (ej. 'MAD').
 * @param {string} type - Tipo de vuelo: 'S' (Salidas) o 'L' (Llegadas).
 * @returns {Promise<any[]>} Promesa que resuelve a un array de vuelos crudos de AENA.
 */
async function fetchAena(iata: string, type: string): Promise<any[]> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.aena.es',
      port: 443,
      path: `/sites/Satellite?pagename=AENA_ConsultarVuelos&airport=${iata}&flightType=${type}&dosDias=si`,
      method: 'POST',
      headers: headers,
      timeout: 5000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (d) => { data += d; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(Array.isArray(json) ? json : []);
        } catch (e) {
          resolve([]);
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
    req.on('error', () => resolve([]));
    req.end();
  });
}

/**
 * Transforma el JSON crudo de AENA al formato estándar de Aviationstack.
 * Esto asegura compatibilidad total con la interfaz Lit ya desarrollada.
 * 
 * @param {any} aenaFlight - Objeto de vuelo devuelto por la API de AENA.
 * @returns {Object} Objeto de vuelo estructurado (tipo Aviationstack).
 */
function mapAenaToAviationstack(aenaFlight: any) {
  let scheduled = null;
  if (aenaFlight.fecha && aenaFlight.horaProgramada) {
    const [day, month, year] = aenaFlight.fecha.split('/');
    scheduled = `${year}-${month}-${day}T${aenaFlight.horaProgramada}+00:00`;
  }
  const isDeparture = aenaFlight.tipoVuelo === 'S';
  const depIata = isDeparture ? aenaFlight.iataAena : aenaFlight.iataOtro;
  const depName = isDeparture ? "Aeropuerto AENA" : (aenaFlight.ciudadIataOtro || depIata);
  const arrIata = isDeparture ? aenaFlight.iataOtro : aenaFlight.iataAena;
  const arrName = isDeparture ? (aenaFlight.ciudadIataOtro || arrIata) : "Aeropuerto AENA";

  return {
    flight_date: scheduled ? scheduled.split('T')[0] : new Date().toISOString().split('T')[0],
    flight_status: (aenaFlight.estado || '').toLowerCase().includes('aterrizado') ? 'landed' :
                   (aenaFlight.estado || '').toLowerCase().includes('cancelado') ? 'cancelled' : 'scheduled',
    departure: {
      airport: depName,
      timezone: "Europe/Madrid",
      iata: depIata,
      terminal: isDeparture ? aenaFlight.terminal : null,
      gate: isDeparture ? aenaFlight.puertaPrimera : null,
      delay: null,
      scheduled: scheduled,
      estimated: scheduled
    },
    arrival: {
      airport: arrName,
      timezone: "Europe/Madrid",
      iata: arrIata,
      terminal: isDeparture ? null : aenaFlight.terminal,
      gate: isDeparture ? null : aenaFlight.puertaPrimera,
      delay: null,
      scheduled: scheduled,
      estimated: scheduled
    },
    airline: {
      name: aenaFlight.nombreCompania || aenaFlight.compania || "Unknown",
      iata: aenaFlight.iataCompania || ""
    },
    flight: {
      number: aenaFlight.numVuelo || "",
      iata: (aenaFlight.iataCompania || "") + (aenaFlight.numVuelo || "")
    }
  };
}

/**
 * @class AenaScraper
 * @description Gestor de scraping automatizado. Realiza el barrido de todos los aeropuertos,
 * procesa y almacena los resultados en RAM para acceso instantáneo.
 */
export class AenaScraper {
  /** @private {any[]} inMemoryFlights - Almacenamiento local de los datos extraídos. */
  private inMemoryFlights: any[] = [];
  /** @private {Date | null} lastFetchTime - Marca de tiempo de la última actualización exitosa. */
  private lastFetchTime: Date | null = null;

  /**
   * Constructor sin side-effects. 
   * En Serverless el barrido es on-demand (Lazy).
   */
  constructor() {
    // Sin setInterval
  }

  /**
   * Obtiene la copia actual de los vuelos.
   * Si la caché es mayor a 1 hora o está vacía, extrae de nuevo.
   * 
   * @returns {Promise<Object>} Contenedor con los datos y fecha de refresco.
   */
  public async getFlights(): Promise<any> {
    const now = new Date();
    const cacheAge = this.lastFetchTime ? now.getTime() - this.lastFetchTime.getTime() : Infinity;

    // Si la caché tiene más de 1 hora (3600000 ms), refrescamos
    if (cacheAge > 3600000) {
      await this.scrapeAll();
    }

    return {
      lastUpdate: this.lastFetchTime,
      data: this.inMemoryFlights
    };
  }

  /**
   * Método interno que orquesta el barrido completo por los 48 aeropuertos españoles,
   * deduplica resultados y actualiza la caché en RAM.
   * 
   * @private
   */
  private async scrapeAll() {
    console.log(`[Scraper] Iniciando extracción de vuelos a las ${new Date().toLocaleTimeString()}...`);
    const allFlights: any[] = [];
    
    for (let i = 0; i < AIRPORTS.length; i++) {
      const iata = AIRPORTS[i];
      const [salidas, llegadas] = await Promise.all([
        fetchAena(iata, 'S'),
        fetchAena(iata, 'L')
      ]);
      allFlights.push(...salidas.map(mapAenaToAviationstack), ...llegadas.map(mapAenaToAviationstack));
      await new Promise(r => setTimeout(r, 100)); // Delay para no ahogar los servidores de AENA
    }
    
    const uniqueFlights: any[] = [];
    const seen = new Set();
    for (const f of allFlights) {
        const key = `${f.flight.iata}-${f.departure.scheduled}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueFlights.push(f);
        }
    }

    this.inMemoryFlights = uniqueFlights;
    this.lastFetchTime = new Date();
    console.log(`[Scraper] Éxito: ${uniqueFlights.length} vuelos cargados en memoria.`);
  }
}

export const scraperInstance = new AenaScraper();
