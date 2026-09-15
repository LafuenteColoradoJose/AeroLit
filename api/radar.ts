import { openskyInstance } from '../server/opensky-scraper.js';

export default async function handler(req: any, res: any) {
    try {
        const planes = await openskyInstance.getPlanes();
        res.status(200).json(planes.data);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
