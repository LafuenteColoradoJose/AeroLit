import type { Flight } from '../models/flight';

export interface KpiStats {
  total: number;
  active: number;
  cancelled: number;
  scheduled: number;
}

class FlightService {
  private flights: Flight[] = [];
  private fetchPromise: Promise<Flight[]> | null = null;

  async getFlights(): Promise<Flight[]> {
    if (this.flights.length > 0) {
      return this.flights;
    }

    if (!this.fetchPromise) {
      this.fetchPromise = this.fetchData();
    }

    return this.fetchPromise;
  }

  private async fetchData(): Promise<Flight[]> {
    try {
      const response = await fetch('/src/assets/mock-flights.json');
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // La API mockeada devuelve { data: Flight[] }
      if (data && Array.isArray(data.data)) {
        this.flights = data.data;
      } else {
        this.flights = [];
      }
      return this.flights;
    } catch (error) {
      console.error('Error fetching flights:', error);
      throw error;
    }
  }

  async getKpiStats(): Promise<KpiStats> {
    const flights = await this.getFlights();
    
    return flights.reduce((acc, flight) => {
      acc.total += 1;
      
      if (flight.flight_status === 'active') {
        acc.active += 1;
      } else if (flight.flight_status === 'cancelled') {
        acc.cancelled += 1;
      } else if (flight.flight_status === 'scheduled') {
        acc.scheduled += 1;
      }
      
      return acc;
    }, {
      total: 0,
      active: 0,
      cancelled: 0,
      scheduled: 0
    });
  }

  async getUrgentFlights(): Promise<Flight[]> {
    const flights = await this.getFlights();
    return flights.filter(f => 
      f.flight_status === 'cancelled' || 
      f.flight_status === 'incident' || 
      f.flight_status === 'diverted' || 
      (f.departure && f.departure.delay && f.departure.delay > 0)
    );
  }

  async getFlightsByTime(): Promise<{ labels: string[], data: number[] }> {
    const flights = await this.getFlights();
    // Inicializar contadores por hora (0-23)
    const hourCounts = new Array(24).fill(0);
    
    flights.forEach(f => {
      // Usaremos la hora de salida programada para la métrica
      if (f.departure && f.departure.scheduled) {
        const date = new Date(f.departure.scheduled);
        const hour = date.getHours();
        if (!isNaN(hour)) {
          hourCounts[hour]++;
        }
      }
    });

    // Para que quede bonito, solo devolveremos las horas que tengan actividad
    // o un rango normal (ej. 06:00 a 22:00) si quisiéramos, 
    // pero de momento enviamos todo formateado.
    const labels = hourCounts.map((_, i) => `${i.toString().padStart(2, '0')}:00`);
    return { labels, data: hourCounts };
  }

  // Método auxiliar para resetear el estado (útil en tests)
  _reset() {
    this.flights = [];
    this.fetchPromise = null;
  }

  /**
   * Obtiene aviones en tiempo real usando la API pública gratuita de OpenSky Network.
   * Devuelve aviones volando sobre la Península Ibérica.
   */
  async getLivePlanes(): Promise<any[]> {
    try {
      // Bounding box para España/Portugal. Usamos el proxy de Vite (/api/opensky) para evitar CORS
      const response = await fetch('/api/opensky/states/all?lamin=35.0&lomin=-10.0&lamax=44.0&lomax=5.0');
      
      if (!response.ok) {
        throw new Error('Error en OpenSky Network');
      }

      const data = await response.json();
      
      // La API de OpenSky devuelve un array de arrays en "states".
      // Los índices son: 1=callsign, 2=country, 5=longitude, 6=latitude, 7=altitude, 10=true_track(direction), 9=velocity
      return (data.states || [])
        .filter((state: any) => state[5] != null && state[6] != null && !state[8]) // Solo aviones en el aire con coordenadas
        .map((state: any) => ({
          callsign: state[1] ? state[1].trim() : 'Desconocido',
          country: state[2],
          longitude: state[5],
          latitude: state[6],
          altitude: state[7] != null ? Math.round(state[7] * 3.28084) : 0, // Metros a pies
          velocity: state[9] != null ? Math.round(state[9] * 3.6) : 0, // m/s a km/h
          direction: state[10] || 0
        }));
    } catch (error) {
      console.error('Error fetching live planes from OpenSky:', error);
      return [];
    }
  }
}

export const flightService = new FlightService();
