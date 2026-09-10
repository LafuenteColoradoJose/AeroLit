import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_FILE_PATH = path.join(__dirname, '../src/assets/mock-flights.json');

const API_KEY = process.env.VITE_AVIATIONSTACK_API_KEY;

if (!API_KEY) {
  console.error("❌ ERROR: No se encontró VITE_AVIATIONSTACK_API_KEY en el archivo .env");
  process.exit(1);
}

// Aviationstack en su plan gratuito solo permite HTTP, no HTTPS.
// APILayer.net endpoint para Aviationstack
const url = `https://api.apilayer.net/aviationstack/v1/flights?access_key=${API_KEY}&limit=100`;

console.log("✈️ Obteniendo 100 vuelos reales de Aviationstack (apilayer.net)...");

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.error) {
        console.error("❌ API Error:", response.error.message || response.error.info || response.error);
        process.exit(1);
      }

      if (!response.data || !Array.isArray(response.data)) {
        console.error("❌ Error de formato en la respuesta:", response);
        process.exit(1);
      }

      const flights = response.data;
      console.log(`✅ Se obtuvieron ${flights.length} vuelos reales.`);

      fs.writeFileSync(MOCK_FILE_PATH, JSON.stringify({ data: flights }, null, 2), 'utf-8');
      
      console.log(`💾 Guardados exitosamente en src/assets/mock-flights.json`);
      console.log("🚀 ¡Tu dashboard ahora usa datos reales!");

    } catch (e) {
      console.error("❌ Error al parsear el JSON de la respuesta", e);
    }
  });
}).on('error', (err) => {
  console.error("❌ Error en la petición HTTP:", err.message);
});
