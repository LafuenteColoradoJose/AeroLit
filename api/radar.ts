import { openskyInstance } from '../server/opensky-scraper.js';

// Generador de vuelos simulados sobre España por si OpenSky bloquea la IP de Vercel (AWS)
function generateMockPlanes() {
    const planes = [];
    const latMin = 36.0, latMax = 43.5;
    const lonMin = -9.0, lonMax = 3.0;
    
    for (let i = 0; i < 40; i++) {
        planes.push([
            `MOCK${i}`, // 0: icao24
            `AENA${1000+i}`, // 1: callsign
            "Spain", // 2: origin_country
            null, // 3: time_position
            null, // 4: last_contact
            lonMin + Math.random() * (lonMax - lonMin), // 5: longitude
            latMin + Math.random() * (latMax - latMin), // 6: latitude
            8000 + Math.random() * 30000, // 7: baro_altitude
            false, // 8: on_ground
            200 + Math.random() * 100, // 9: velocity
            Math.random() * 360, // 10: true_track
            0, // 11: vertical_rate
            null, null, null, false, 0
        ]);
    }
    return { states: planes };
}

export default async function handler(req: any, res: any) {
    try {
        let planes = await openskyInstance.getPlanes();
        
        // Si OpenSky devuelve vacío (típico ban a IPs de AWS/Vercel)
        if (!planes || !planes.data || !planes.data.states || planes.data.states.length === 0) {
            console.log('[Radar] OpenSky vacío/bloqueado. Generando vuelos simulados...');
            planes = { data: generateMockPlanes() };
        }
        
        res.status(200).json(planes.data);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
