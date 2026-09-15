import re

with open('server/opensky-scraper.test.ts', 'r') as f:
    code = f.read()

code = re.sub(
    r"it\('debería manejar errores de red \(req\.on\(\"error\"\)\)', async \(\) => {[\s\S]*?consoleSpy\.mockRestore\(\);\n  }\);",
    """it('debería manejar errores de red (req.on("error"))', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockHttpsRequest(200, '', true, false);
    scraper = new OpenSkyScraper();
    
    await scraper.getPlanes();
    expect(consoleSpy).toHaveBeenCalledWith('[Radar] Error de red: Network error simulated');
    
    consoleSpy.mockRestore();
  });""",
    code
)

code = re.sub(
    r"it\('debería destruir la request si hay timeout \(req\.on\(\"timeout\"\)\)', async \(\) => {[\s\S]*?expect\(mocks\.req\.destroy\)\.toHaveBeenCalled\(\);\n  }\);",
    """it('debería destruir la request si hay timeout (req.on("timeout"))', async () => {
    const mocks = mockHttpsRequest(200, '', false, true);
    scraper = new OpenSkyScraper();
    
    await scraper.getPlanes();
    expect(mocks.req.destroy).toHaveBeenCalled();
  });""",
    code
)

code = code.replace("await await", "await")

with open('server/opensky-scraper.test.ts', 'w') as f:
    f.write(code)

