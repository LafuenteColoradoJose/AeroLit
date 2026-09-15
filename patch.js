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
