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

  // Método auxiliar para resetear el estado (útil en tests)
  _reset() {
    this.flights = [];
    this.fetchPromise = null;
  }
}

export const flightService = new FlightService();
