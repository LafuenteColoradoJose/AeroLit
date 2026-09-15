/**
 * @file server.ts
 * @description Servidor backend principal de AeroLit basado en Express.
 * Sirve como puente entre la aplicación cliente (Lit) y los motores de extracción de datos,
 * solucionando problemas de CORS y ofreciendo una caché centralizada.
 */

import express from 'express';
import cors from 'cors';
import { scraperInstance } from './aena-scraper.js'; 
import { openskyInstance } from './opensky-scraper.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * @route GET /api/flights
 * @description Endpoint principal que retorna la lista completa de vuelos 
 * guardados en la memoria RAM del servidor.
 * @returns {Object} JSON con metadatos de la última actualización y el array de vuelos.
 */
app.get('/api/flights', async (req, res) => {
    const vuelos = await scraperInstance.getFlights();
    res.json(vuelos);
});

/**
 * @route GET /api/radar
 * @description Endpoint que retorna las posiciones de aviones en vivo 
 * (Caché extraída de OpenSky Network sin penalización de rate-limit).
 */
app.get('/api/radar', async (req, res) => {
    const planes = await openskyInstance.getPlanes();
    res.json(planes.data); 
});

// Iniciamos el servidor sólo si es el proceso principal (evita bloqueos en los tests)
/* c8 ignore next 5 */
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
      console.log(`[Server] Backend proxy escuchando en http://localhost:${PORT}`);
  });
}

export { app };
