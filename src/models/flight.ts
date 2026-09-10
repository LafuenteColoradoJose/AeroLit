export interface Flight {
    flight_date: string;
    flight_status: 'scheduled' | 'active' | 'landed' | 'cancelled' | 'incident' | 'diverted';
    departure: FlightAirportDetails;
    arrival: FlightAirportDetails;
    airline: Airline;
    flight: FlightDetails;
    live?: LiveTracking | null;
}

export interface LiveTracking {
    updated: string;
    latitude: number;
    longitude: number;
    altitude: number;
    direction: number;
    speed_horizontal: number;
    speed_vertical: number;
    is_ground: boolean;
}

export interface FlightAirportDetails {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal: string | null;
    gate: string | null;
    delay: number | null;
    scheduled: string;
    estimated: string;
    actual: string | null;
    estimated_runway: string | null;
    actual_runway: string | null;
    baggage?: string | null;
}

export interface Airline {
    name: string;
    iata: string;
    icao: string;
}

export interface FlightDetails {
    number: string;
    iata: string;
    icao: string;
    codeshared: any | null;
}
