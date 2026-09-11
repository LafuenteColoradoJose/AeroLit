import type { Flight } from '../models/flight';

export interface KpiStats {
  total: number;
  active: number;
  cancelled: number;
  scheduled: number;
  landed: number;
  activeTrend: string;
  scheduledTrend: string;
}

const CACHE_KEY = 'aerolit_flights_cache';
const CACHE_TIME_KEY = 'aerolit_flights_time';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 horas en ms

class FlightService {
  private flights: Flight[] = [];
  private fetchPromise: Promise<Flight[]> | null = null;
  private networkPollingInterval: any = null;

  async getFlights(forceFetch: boolean = false): Promise<Flight[]> {
    if (!forceFetch && this.flights.length > 0) {
      return this.getSimulatedFlights();
    }

    if (!this.fetchPromise || forceFetch) {
      this.fetchPromise = this.fetchData(forceFetch);
    }

    await this.fetchPromise;
    return this.getSimulatedFlights();
  }

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

      // 2. Fetch a la "Red" (Simulada por nuestro JSON local, pero aquí iría AENA)
      const response = await fetch('/src/assets/mock-flights.json?v=' + new Date().getTime());
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data.data)) {
        this.flights = data.data;
        // Guardar en caché
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
   * El MOTOR DEL SIMULADOR: 
   * Evalúa los vuelos basándose en la hora actual del dispositivo del usuario
   * para transformar vuelos 'scheduled' en 'active' o 'landed' sin tocar la API.
   */
  private getSimulatedFlights(): Flight[] {
    const now = new Date().getTime();
    
    return this.flights.map(f => {
      // Si el vuelo tiene una excepción dura, la respetamos
      if (f.flight_status === 'cancelled' || f.flight_status === 'incident' || f.flight_status === 'diverted') {
        return f;
      }

      // Si no tenemos horas, devolvemos el vuelo tal cual
      if (!f.departure?.scheduled) return f;

      const depTime = new Date(f.departure.scheduled).getTime();
      // Muchas APIs mockeadas devuelven la misma hora de salida y llegada.
      // Si arrival existe pero es <= departure, forzamos un vuelo de 2 horas.
      let arrTime = f.arrival?.scheduled ? new Date(f.arrival.scheduled).getTime() : 0;
      if (!arrTime || arrTime <= depTime) {
          arrTime = depTime + (2 * 60 * 60 * 1000);
      }

      let simulatedStatus = f.flight_status;

      // LA MAGIA DEL TIEMPO REAL:
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

  async getKpiStats(): Promise<KpiStats> {
    const flights = await this.getFlights(); // Trae los vuelos simulados
    const now = new Date().getTime();
    
    let active = 0, cancelled = 0, scheduled = 0, landed = 0;
    let recentTakeoffs = 0; // Despegues en la última hora
    let nextTakeoffs = 0; // Despegues en la próxima hora
    
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

  async getUrgentFlights(): Promise<Flight[]> {
    const flights = await this.getFlights(); // Simulados
    return flights.filter(f => 
      f.flight_status === 'cancelled' || 
      f.flight_status === 'incident' || 
      f.flight_status === 'diverted' || 
      (f.departure && f.departure.delay && f.departure.delay > 0)
    );
  }

  async getUpcomingFlights(limit: number = 5): Promise<Flight[]> {
    const flights = await this.getFlights(); // Simulados
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

  async getFlightsByTime(): Promise<{ labels: string[], data: number[] }> {
    const flights = await this.getFlights(); // Simulados
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
   * Arranca el Polling de 15 minutos para actualizar "Deltas" (Cancelaciones, etc)
   * saltándose el bloque caché.
   */
  startHybridEngine(onNetworkUpdate: () => void) {
    if (this.networkPollingInterval) clearInterval(this.networkPollingInterval);
    
    // Polling cada 15 min (15 * 60 * 1000)
    this.networkPollingInterval = setInterval(async () => {
      console.log('🔄 Hybrid Engine: Ejecutando Polling Ligero de 15 min...');
      await this.getFlights(true); // forceFetch = true bypasses 12h cache
      if (onNetworkUpdate) onNetworkUpdate();
    }, 15 * 60 * 1000);
  }

  stopHybridEngine() {
    if (this.networkPollingInterval) clearInterval(this.networkPollingInterval);
  }

  _reset() {
    this.flights = [];
    this.fetchPromise = null;
    this.stopHybridEngine();
    if (typeof window !== 'undefined') {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
    }
  }

  async getLivePlanes(): Promise<any[]> {
    try {
      const response = await fetch('/api/opensky/states/all?lamin=35.0&lomin=-10.0&lamax=44.0&lomax=5.0');
      if (!response.ok) throw new Error('Error en OpenSky Network');
      const data = await response.json();
      return (data.states || [])
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
    } catch (error) {
      console.error('Error fetching live planes:', error);
      return [];
    }
  }
}

export const flightService = new FlightService();
