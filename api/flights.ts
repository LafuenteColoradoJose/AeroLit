import { scraperInstance } from '../server/aena-scraper.js';

export default async function handler(req: any, res: any) {
    try {
        const vuelos = await scraperInstance.getFlights();
        res.status(200).json(vuelos);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
