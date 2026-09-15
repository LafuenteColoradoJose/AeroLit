/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from './server';
import { scraperInstance } from './aena-scraper';
import { openskyInstance } from './opensky-scraper';

describe('Servidor Express API', () => {
  beforeAll(() => {
    vi.spyOn(scraperInstance, 'getFlights').mockReturnValue({
      lastUpdate: new Date('2026-09-15T10:00:00Z'),
      data: [{ flight: { iata: 'IB1234' } }]
    });

    vi.spyOn(openskyInstance, 'getPlanes').mockReturnValue({
      lastUpdate: new Date('2026-09-15T10:00:00Z'),
      data: { states: [['plane1'], ['plane2']] }
    });
  });

  it('debería responder en GET /api/flights con estado 200 y el formato esperado', async () => {
    const res = await request(app).get('/api/flights');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('lastUpdate');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data[0].flight.iata).toBe('IB1234');
  });

  it('debería responder en GET /api/radar con estado 200 y la lista states de OpenSky', async () => {
    const res = await request(app).get('/api/radar');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('states');
    expect(res.body.states.length).toBe(2);
  });

  it('debería tener configurado CORS (cabecera access-control-allow-origin)', async () => {
    const res = await request(app).get('/api/flights');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

});
