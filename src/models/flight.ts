/**
 * Modelo de datos principal que representa un vuelo individual
 * extraído de la API (mock de AENA) o procesado por el motor híbrido.
 * 
 * @interface Flight
 */
export interface Flight {
    /** Fecha de la operación en formato ISO (YYYY-MM-DD) */
    flight_date: string;
    
    /** 
     * Estado operativo del vuelo. 
     * NOTA: El `flightService` puede sobreescribir dinámicamente este valor 
     * a 'active' o 'landed' simulando tiempo real.
     */
    flight_status: 'scheduled' | 'active' | 'landed' | 'cancelled' | 'incident' | 'diverted';
    
    /** Información y tiempos de salida */
    departure: FlightAirportDetails;
    
    /** Información y tiempos de llegada */
    arrival: FlightAirportDetails;
    
    /** Información comercial de la aerolínea operadora */
    airline: Airline;
    
    /** Identificadores de vuelo y códigos compartidos */
    flight: FlightDetails;
    
    /** Telemetría opcional en tiempo real para integración con radares (ej. OpenSky) */
    live?: LiveTracking | null;
}

/**
 * Representa la telemetría posicional de una aeronave en vuelo.
 * 
 * @interface LiveTracking
 */
export interface LiveTracking {
    /** Fecha/hora de la última actualización del transpondedor */
    updated: string;
    /** Latitud GPS en grados decimales */
    latitude: number;
    /** Longitud GPS en grados decimales */
    longitude: number;
    /** Altitud en pies o metros (dependiente de la API proveedora) */
    altitude: number;
    /** Rumbo de la aeronave en grados (0-360) */
    direction: number;
    /** Velocidad horizontal (Ground Speed) */
    speed_horizontal: number;
    /** Tasa de ascenso o descenso (Vertical Speed) */
    speed_vertical: number;
    /** True si la aeronave transmite estar en tierra (weight-on-wheels) */
    is_ground: boolean;
}

/**
 * Detalla la información de un aeropuerto en el contexto de una salida o llegada,
 * incluyendo terminales, puertas y toda la trazabilidad de tiempos (programado, estimado, real).
 * 
 * @interface FlightAirportDetails
 */
export interface FlightAirportDetails {
    /** Nombre completo del aeropuerto */
    airport: string;
    /** Zona horaria IANA (ej. 'Europe/Madrid') */
    timezone: string;
    /** Código IATA de 3 letras (ej. 'MAD', 'BCN') */
    iata: string;
    /** Código OACI de 4 letras (ej. 'LEMD') */
    icao: string;
    /** Terminal asignada (puede ser null hasta poco antes del vuelo) */
    terminal: string | null;
    /** Puerta de embarque asignada (suele ser null en el mock a menos que sea inminente) */
    gate: string | null;
    /** Retraso acumulado en minutos (null si no hay retraso reportado) */
    delay: number | null;
    /** Hora original programada (formato ISO 8601 con UTC) */
    scheduled: string;
    /** Hora estimada actual de operación (ajustada por retrasos) */
    estimated: string;
    /** Hora real en la que ocurrió el evento (descalce o calce) */
    actual: string | null;
    /** Hora estimada de pista (despegue o aterrizaje efectivo) */
    estimated_runway: string | null;
    /** Hora real de pista (ruedas arriba o ruedas abajo) */
    actual_runway: string | null;
    /** Cinta de recogida de equipaje asignada (solo aplica a llegadas) */
    baggage?: string | null;
}

/**
 * Identificación de la aerolínea operadora.
 * 
 * @interface Airline
 */
export interface Airline {
    /** Nombre comercial de la aerolínea */
    name: string;
    /** Código IATA de 2 caracteres (ej. 'IB' para Iberia) */
    iata: string;
    /** Código OACI de 3 caracteres (ej. 'IBE') */
    icao: string;
}

/**
 * Identificación operativa del vuelo comercial.
 * 
 * @interface FlightDetails
 */
export interface FlightDetails {
    /** Número numérico del vuelo (ej. '3166') */
    number: string;
    /** Código de vuelo IATA completo (ej. 'IB3166') */
    iata: string;
    /** Código de vuelo OACI completo (ej. 'IBE3166') */
    icao: string;
    /** Información sobre vuelos en código compartido, si la hay */
    codeshared: any | null;
}
