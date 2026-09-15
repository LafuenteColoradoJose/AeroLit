import re

with open('server/aena-scraper.ts', 'r') as f:
    code = f.read()

replacement = """  private async scrapeAll() {
    console.log(`[Scraper] Iniciando extracción de vuelos a las ${new Date().toLocaleTimeString()}...`);
    const allFlights: any[] = [];
    
    // Chunking to avoid Vercel 10s timeout
    const chunkSize = 12;
    for (let i = 0; i < AIRPORTS.length; i += chunkSize) {
      const chunk = AIRPORTS.slice(i, i + chunkSize);
      const promises = chunk.flatMap(iata => [
        fetchAena(iata, 'S'),
        fetchAena(iata, 'L')
      ]);
      const results = await Promise.all(promises);
      results.forEach(flights => {
        allFlights.push(...flights.map(mapAenaToAviationstack));
      });
    }
    
    const uniqueFlights: any[] = [];"""

code = re.sub(
    r"  private async scrapeAll\(\) \{[\s\S]*?const uniqueFlights: any\[\] = \[\];",
    replacement,
    code
)

with open('server/aena-scraper.ts', 'w') as f:
    f.write(code)

