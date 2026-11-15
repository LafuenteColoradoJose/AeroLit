import { openskyInstance } from '../server/opensky-scraper.js';

/**
 * Endpoint serverless que sirve las posiciones de aeronaves del radar.
 *
 * Devuelve siempre un objeto con `states` (formato estilo OpenSky) y
 * `lastUpdate`, de modo que el cliente pueda mostrar la antigüedad del dato.
 *
 * @param {any} req - Petición HTTP gestionada por Vercel.
 * @param {any} res - Respuesta HTTP gestionada por Vercel.
 * @returns {Promise<void>} Promesa que resuelve al enviar la respuesta.
 */
export default async function handler(req: any, res: any) {
  try {
    const planes = await openskyInstance.getPlanes();

    // Cache breve en el edge: el radar se refresca cada 60 s en el cliente.
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    res.status(200).json({
      states: planes.data.states ?? [],
      lastUpdate: planes.lastUpdate,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
