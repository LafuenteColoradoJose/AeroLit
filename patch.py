import re

with open('server/opensky-scraper.test.ts', 'r') as f:
    code = f.read()

code = re.sub(
    r"it\('debería volver a hacer fetch cada 15 segundos'[\s\S]*\}\);",
    """it('debería hacer lazy fetch solo si la caché expiró (10 segundos)', async () => {
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
  });""",
    code
)
with open('server/opensky-scraper.test.ts', 'w') as f:
    f.write(code)

with open('server/aena-scraper.test.ts', 'r') as f:
    code2 = f.read()

code2 = re.sub(
    r"const result = scraper\.getFlights\(\);\s*expect",
    """const resultPromise = scraper.getFlights();
    for (let i = 0; i < 50; i++) {
        await vi.advanceTimersByTimeAsync(150);
    }
    const result = await resultPromise;
    expect""",
    code2
)
with open('server/aena-scraper.test.ts', 'w') as f:
    f.write(code2)

