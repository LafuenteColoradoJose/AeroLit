import type { Flight } from '../models/flight';

const CACHE_KEY = 'aerolit_flights_cache_v2';
const CACHE_TIME_KEY = 'aerolit_flights_cache_time';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 horas en milisegundos

/**
 * Define la estructura de las estadísticas clave de rendimiento (KPIs) 
 * mostradas en el Dashboard principal.
 * 
 * @interface KpiStats
 * @property {number} total - Número total de vuelos en el dataset actual.
 * @property {number} active - Número de vuelos actualmente en el aire.
 * @property {number} cancelled - Número de vuelos cancelados.
 * @property {number} scheduled - Número de vuelos programados para el futuro.
 * @property {number} landed - Número de vuelos que ya han aterrizado.
 * @property {string} activeTrend - Texto dinámico que indica la tendencia de despegues recientes.
 * @property {string} scheduledTrend - Texto dinámico que indica la tendencia de despegues próximos.
 */
export interface KpiStats {
  total: number;
  active: number;
  cancelled: number;
  scheduled: number;
  landed: number;
  activeTrend: string;
  scheduledTrend: string;
}

/**
 * Servicio central de gestión de vuelos (Singleton).
 * Implementa un "Motor Híbrido" (Hybrid Engine) diseñado específicamente para 
 * mitigar bloqueos de Firewalls de Aplicaciones Web (WAF) como Akamai.
 * 
 * @class FlightService
 * @description 
 * La arquitectura de este servicio se basa en tres pilares:
 * 1. **Caché Pesada Local (12h)**: Evita descargar el payload de 23MB de AENA repetidas veces.
 * 2. **Simulador de Tiempo Real**: Transforma vuelos 'scheduled' a 'active' o 'landed' interpolando la hora local del sistema contra la fecha programada.
 * 3. **Polling Ligero (15 min)**: Fuerza actualizaciones en segundo plano para captar deltas (cancelaciones, retrasos).
 */
export class FlightService {
  /** Caché en memoria para las posiciones de aviones en vivo (OpenSky API). */
  private livePlanesCache: any[] | null = null;
  /** Marca de tiempo (timestamp) de la última vez que se solicitó posición en vivo. */
  private lastLivePlanesFetch: number = 0;

  /** Almacenamiento local principal en memoria para la lista de vuelos mockeados/reales. */
  private flights: Flight[] = [];
  /** Promesa en curso para evitar condiciones de carrera (múltiples requests simultáneos). */
  private fetchPromise: Promise<Flight[]> | null = null;
  /** ID del intervalo de actualización automática periódica (Hybrid Engine). */
  private networkPollingInterval: any = null;

  /**
   * Obtiene la lista maestra de vuelos, ya sea desde la caché, RAM o red,
   * y los pasa por el simulador de tiempo real para devolver su estado actualizado.
   * 
   * @param {boolean} [forceFetch=false] - Si es `true`, ignora la caché local y fuerza una petición de red.
   * @returns {Promise<Flight[]>} Promesa que resuelve en el array de vuelos con estados simulados.
   */
  async getFlights(forceFetch: boolean = false): Promise<Flight[]> {
    if (this.flights.length > 0 && !forceFetch) {
      return this.getSimulatedFlights();
    }

    if (!this.fetchPromise || forceFetch) {
      this.fetchPromise = this.fetchData(forceFetch);
    }

    await this.fetchPromise;
    return this.getSimulatedFlights();
  }

  /**
   * Método interno que maneja la lógica de petición de datos y caché.
   * 
   * @private
   * @param {boolean} forceFetch - Indica si se debe saltar la validación de caché.
   * @returns {Promise<Flight[]>} El array crudo de vuelos descargados o recuperados de caché.
   * @throws {Error} Lanza un error si la petición de red falla y no hay caché disponible.
   */
  private async fetchData(forceFetch: boolean = false): Promise<Flight[]> {
    try {
      // 1. Verificar la caché (El bloque pesado de 12 horas)
      if (!forceFetch && typeof window !== 'undefined') {
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        if (cachedTime) {
          const age = new Date().getTime() - parseInt(cachedTime, 10);
          if (age < CACHE_DURATION) {
            const cachedData = localStorage.getItem(CACHE_KEY);
            if (cachedData) {
              this.flights = JSON.parse(cachedData);
              return this.flights;
            }
          }
        }
      }

      // 2. Fetch a la red (Directo al nuevo Backend Node)
      const response = await fetch('/api/flights?v=' + new Date().getTime());
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      let flightsArray = [];
      if (data && Array.isArray(data.data)) {
        flightsArray = data.data;
      } else if (Array.isArray(data)) {
        flightsArray = data;
      }

      if (flightsArray.length > 0) {
        this.flights = flightsArray;
        // Guardar en caché con protección QuotaExceeded
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(this.flights));
            localStorage.setItem(CACHE_TIME_KEY, new Date().getTime().toString());
          } catch (e) {
            console.warn('⚠️ No se pudo guardar en localStorage (probablemente excede los 5MB). Funcionando en RAM temporalmente.', e);
          }
        }
      } else {
        this.flights = [];
      }
      return this.flights;
    } catch (error) {
      console.error('Error fetching flights:', error);
      // Fallback a caché si la red falla
      if (typeof window !== 'undefined') {
         const cachedData = localStorage.getItem(CACHE_KEY);
         if (cachedData) {
            this.flights = JSON.parse(cachedData);
            return this.flights;
         }
      }
      throw error;
    }
  }

  /**
   * El MOTOR DEL SIMULADOR PREDICTIVO.
   * Evalúa los vuelos basándose en la hora actual del dispositivo del usuario.
   * 
   * @private
   * @description Modifica el estado ('flight_status') al vuelo:
   * - `scheduled`: Si la hora actual es anterior a la hora de salida.
   * - `active`: Si la hora actual está entre la salida y la llegada.
   * - `landed`: Si la hora actual es posterior a la hora de llegada.
   * @returns {Flight[]} Un array de vuelos transformados según la interpolación temporal.
   */
  private getSimulatedFlights(): Flight[] {
    const now = new Date().getTime();
    
    return this.flights.map(f => {
      if (f.flight_status === 'cancelled' || f.flight_status === 'incident' || f.flight_status === 'diverted') {
        return f;
      }

      if (!f.departure?.scheduled) return f;

      const depTime = new Date(f.departure.scheduled).getTime();
      let arrTime = f.arrival?.scheduled ? new Date(f.arrival.scheduled).getTime() : 0;
      
      // Fallback para APIs con datos defectuosos (misma hora salida/llegada)
      if (!arrTime || arrTime <= depTime) {
          arrTime = depTime + (2 * 60 * 60 * 1000); // Se asumen 2 horas estándar
      }

      let simulatedStatus = f.flight_status;

      if (now < depTime) {
        simulatedStatus = 'scheduled';
      } else if (now >= depTime && now < arrTime) {
        simulatedStatus = 'active';
      } else if (now >= arrTime) {
        simulatedStatus = 'landed';
      }

      return { ...f, flight_status: simulatedStatus };
    });
  }

  /**
   * Calcula estadísticas agregadas para el Dashboard (KPIs).
   * 
   * @returns {Promise<KpiStats>} Objeto con sumatorios y textos de tendencia para renderizar.
   */
  async getKpiStats(): Promise<KpiStats> {
    const flights = await this.getFlights(); 
    const now = new Date().getTime();
    
    let active = 0, cancelled = 0, scheduled = 0, landed = 0;
    let recentTakeoffs = 0; 
    let nextTakeoffs = 0; 
    
    flights.forEach(flight => {
      if (flight.flight_status === 'active') active++;
      else if (flight.flight_status === 'cancelled') cancelled++;
      else if (flight.flight_status === 'scheduled') scheduled++;
      else if (flight.flight_status === 'landed') landed++;
      
      if (flight.departure && flight.departure.scheduled) {
        const depTime = new Date(flight.departure.scheduled).getTime();
        const diffHours = (now - depTime) / (1000 * 60 * 60);
        
        if (diffHours > 0 && diffHours <= 1) {
            recentTakeoffs++;
        } else if (diffHours < 0 && diffHours >= -1) {
            nextTakeoffs++;
        }
      }
    });
    
    return {
      total: flights.length,
      active,
      cancelled,
      scheduled,
      landed,
      activeTrend: recentTakeoffs > 0 ? `${recentTakeoffs} despegues en la última hr` : 'Estable',
      scheduledTrend: nextTakeoffs > 0 ? `${nextTakeoffs} despegues prox. hr` : 'Sin cambios inminentes'
    };
  }

  /**
   * Obtiene la lista de vuelos urgentes o con incidencias.
   * 
   * @returns {Promise<Flight[]>} Vuelos cuyo estado implica un problema ('cancelled', 'incident', retraso).
   */
  async getUrgentFlights(): Promise<Flight[]> {
    const flights = await this.getFlights();
    return flights.filter(f => 
      f.flight_status === 'cancelled' || 
      f.flight_status === 'incident' || 
      f.flight_status === 'diverted' || 
      (f.departure && f.departure.delay && f.departure.delay > 0)
    );
  }

  /**
   * Obtiene la lista de los próximos vuelos programados en el futuro.
   * 
   * @param {number} [limit=5] - Cantidad máxima de vuelos a devolver.
   * @returns {Promise<Flight[]>} Array ordenado cronológicamente con los próximos vuelos.
   */
  async getUpcomingFlights(limit: number = 5): Promise<Flight[]> {
    const flights = await this.getFlights();
    const now = new Date().getTime();
    
    const scheduled = flights.filter(f => {
      if (f.flight_status !== 'scheduled' || !f.departure?.scheduled) return false;
      const flightTime = new Date(f.departure.scheduled).getTime();
      return flightTime > now; 
    });
    
    scheduled.sort((a, b) => {
      const timeA = new Date(a.departure!.scheduled!).getTime();
      const timeB = new Date(b.departure!.scheduled!).getTime();
      return timeA - timeB;
    });
    
    return scheduled.slice(0, limit);
  }

  /**
   * Agrupa los vuelos por su hora de salida para alimentar gráficos de actividad.
   * 
   * @returns {Promise<{ labels: string[], data: number[] }>} Arrays de etiquetas (00:00 - 23:00) y el recuento de vuelos por cada hora.
   */
  async getFlightsByTime(): Promise<{ labels: string[], data: number[] }> {
    const flights = await this.getFlights();
    const hourCounts = new Array(24).fill(0);
    
    flights.forEach(f => {
      if (f.departure && f.departure.scheduled) {
        const date = new Date(f.departure.scheduled);
        const hour = date.getHours();
        if (!isNaN(hour)) {
          hourCounts[hour]++;
        }
      }
    });

    const labels = hourCounts.map((_, i) => `${i.toString().padStart(2, '0')}:00`);
    return { labels, data: hourCounts };
  }

  /**
   * Inicia el ciclo de vida automático del Motor Híbrido (Heartbeat).
   * Ejecuta peticiones de bajo peso a la red de forma periódica para buscar deltas.
   * 
   * @param {() => void} [onNetworkUpdate] - Callback opcional que se ejecuta tras una actualización de red exitosa.
   */
  startHybridEngine(onNetworkUpdate?: () => void) {
    if (this.networkPollingInterval) clearInterval(this.networkPollingInterval);
    
    this.networkPollingInterval = setInterval(async () => {
      console.log('🔄 Hybrid Engine: Ejecutando Polling Ligero de 15 min...');
      await this.getFlights(true); 
      if (onNetworkUpdate) onNetworkUpdate();
    }, 15 * 60 * 1000);
  }

  /**
   * Detiene el Motor Híbrido, pausando el polling de red.
   */
  stopHybridEngine() {
    if (this.networkPollingInterval) clearInterval(this.networkPollingInterval);
  }

  /**
   * Resetea el servicio entero. Útil para entornos de testing.
   * 
   * @private
   */
  _reset() {
    this.flights = [];
    this.fetchPromise = null;
    this.stopHybridEngine();
    if (typeof window !== 'undefined') {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
    }
  }

  /**
   * Recupera datos de posición en tiempo real desde la API pública de OpenSky Network.
   * @deprecated Úsese con precaución en producción por límites de Rate-Limiting.
   * 
   * @returns {Promise<any[]>} Array de posiciones aéreas parseadas.
   */
  
  async getLivePlanes(): Promise<any[]> {
    const now = Date.now();
    if (this.livePlanesCache && (now - this.lastLivePlanesFetch < 30000)) {
      return this.livePlanesCache;
    }

    try {
      const response = await fetch('/api/radar');
      if (!response.ok) throw new Error('Error en el servidor radar');
      const data = await response.json();
      
      const planes = (data.states || [])
        .filter((state: any) => state[5] != null && state[6] != null && !state[8])
        .map((state: any) => ({
          callsign: state[1] ? state[1].trim() : 'Desconocido',
          country: state[2],
          longitude: state[5],
          latitude: state[6],
          altitude: state[7] != null ? Math.round(state[7] * 3.28084) : 0,
          velocity: state[9] != null ? Math.round(state[9] * 3.6) : 0,
          direction: state[10] || 0
        }));
      
      this.livePlanesCache = planes;
      this.lastLivePlanesFetch = Date.now();
      return planes;

    } catch (error) {
      console.error('Error fetching live planes:', error);
      return [];
    }
  }
}

export const flightService = new FlightService();
