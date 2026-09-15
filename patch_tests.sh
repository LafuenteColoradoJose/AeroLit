#!/bin/bash
# Patching opensky-scraper.test.ts
sed -i 's/const result = scraper.getPlanes();/const result = await scraper.getPlanes();/g' server/opensky-scraper.test.ts
sed -i 's/it('\''debería ignorar la respuesta si el JSON es inválido'\'', () => {/it('\''debería ignorar la respuesta si el JSON es inválido'\'', async () => {/g' server/opensky-scraper.test.ts
sed -i 's/it('\''debería ignorar si el statusCode no es 200'\'', () => {/it('\''debería ignorar si el statusCode no es 200'\'', async () => {/g' server/opensky-scraper.test.ts
sed -i 's/it('\''debería manejar errores de red (req.on("error"))'\'', () => {/it('\''debería manejar errores de red (req.on("error"))'\'', async () => {/g' server/opensky-scraper.test.ts
sed -i 's/it('\''debería destruir la request si hay timeout (req.on("timeout"))'\'', () => {/it('\''debería destruir la request si hay timeout (req.on("timeout"))'\'', async () => {/g' server/opensky-scraper.test.ts

# Fixing the setInterval test manually:
cat << 'INNEREOF' > patch.js
const fs = require('fs');
let code = fs.readFileSync('server/opensky-scraper.test.ts', 'utf-8');
code = code.replace(/it\('debería volver a hacer fetch cada 15 segundos'[\s\S]*\}\);/m, 
`it('debería hacer lazy fetch solo si la caché expiró (10 segundos)', async () => {
    const validJson = JSON.stringify({ states: [] });
    mockHttpsRequest(200, validJson);
    scraper = new OpenSkyScraper();
    await scraper.getPlanes();
    expect(https.request).toHaveBeenCalledTimes(1);
    await scraper.getPlanes();
    expect(https.request).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(11 * 1000);
    await scraper.getPlanes();
    expect(https.request).toHaveBeenCalledTimes(2);
  });`);
fs.writeFileSync('server/opensky-scraper.test.ts', code);
INNEREOF
node patch.js

# Patching aena-scraper.test.ts
cat << 'INNEREOF' > patch2.js
const fs = require('fs');
let code = fs.readFileSync('server/aena-scraper.test.ts', 'utf-8');
code = code.replace(/const result = scraper\.getFlights\(\);\s*expect/g, \`const resultPromise = scraper.getFlights();
    for (let i = 0; i < 50; i++) {
        await vi.advanceTimersByTimeAsync(150);
    }
    const result = await resultPromise;
    expect\`);
fs.writeFileSync('server/aena-scraper.test.ts', code);
INNEREOF
node patch2.js

