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
const SPANISH_AIRPORTS = ['MAD', 'BCN', 'PMI', 'AGP', 'ALC'];

console.log("✈️ Obteniendo vuelos reales de Aviationstack para múltiples aeropuertos de España...");

async function fetchAirportFlights(iata) {
  const url = `https://api.apilayer.net/aviationstack/v1/flights?access_key=${API_KEY}&limit=100&dep_iata=${iata}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            console.error(`❌ API Error para ${iata}:`, response.error.message || response.error.info || response.error);
            resolve([]);
          } else if (!response.data || !Array.isArray(response.data)) {
            console.error(`❌ Error de formato en la respuesta para ${iata}`);
            resolve([]);
          } else {
            console.log(`✅ Se obtuvieron ${response.data.length} vuelos para ${iata}.`);
            resolve(response.data);
          }
        } catch (e) {
          console.error(`❌ Error al parsear JSON para ${iata}`, e);
          resolve([]);
        }
      });
    }).on('error', (err) => {
      console.error(`❌ Error HTTP para ${iata}:`, err.message);
      resolve([]);
    });
  });
}

async function fetchAllSpainFlights() {
  let allFlights = [];
  
  for (const iata of SPANISH_AIRPORTS) {
    const flights = await fetchAirportFlights(iata);
    allFlights = allFlights.concat(flights);
  }
  
  if (allFlights.length > 0) {
    fs.writeFileSync(MOCK_FILE_PATH, JSON.stringify({ data: allFlights }, null, 2), 'utf-8');
    console.log(`\n💾 Total combinado: ${allFlights.length} vuelos guardados exitosamente en src/assets/mock-flights.json`);
    console.log("🚀 ¡Tu dashboard ahora tiene una vista nacional completa!");
  } else {
    console.log("❌ No se pudieron obtener vuelos.");
  }
}

fetchAllSpainFlights();
