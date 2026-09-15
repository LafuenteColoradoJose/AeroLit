const fs = require('fs');
let code = fs.readFileSync('server/aena-scraper.test.ts', 'utf-8');
code = code.replace(/const result = scraper\.getFlights\(\);\s*expect/g, \`const resultPromise = scraper.getFlights();
    for (let i = 0; i < 50; i++) {
        await vi.advanceTimersByTimeAsync(150);
    }
    const result = await resultPromise;
    expect\`);
fs.writeFileSync('server/aena-scraper.test.ts', code);
