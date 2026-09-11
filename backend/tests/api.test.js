const request = require('supertest');
const app = require('../server');
const { connectDB, disconnectDB } = require('../config/db');
const seed = require('../scripts/seed');

describe('EcoDrive End-to-End API Integration Suite', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    await seed();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  let token = '';

  test('POST /api/auth/login with demo credentials should return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@ecodrive.com', password: 'Password123!' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  test('GET /api/auth/me with Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.user.email).toBe('demo@ecodrive.com');
  });

  test('GET /api/vehicles should return seeded demo vehicles', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/analytics/dashboard should calculate real user statistics', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.hasData).toBe(true);
    expect(res.body.data.stats.totalTrips).toBeGreaterThan(0);
    expect(res.body.data.stats.avgEcoScore).toBeGreaterThan(0);
  });

  test('POST /api/trips should validate and process a new trip record', async () => {
    const vehiclesRes = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);

    const vehicleId = vehiclesRes.body.data[0]._id;

    const res = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicleId,
        distanceKm: 20.0,
        durationMin: 25,
        avgSpeedKmh: 48,
        maxSpeedKmh: 65,
        idleTimeMin: 1,
        hardAccelerationCount: 0,
        hardBrakingCount: 0,
        startLocation: 'Home',
        endLocation: 'Work'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trip.ecoScore).toBeGreaterThanOrEqual(80);
  });

  test('GET /api/challenges should list challenges with user progress', async () => {
    const res = await request(app)
      .get('/api/challenges')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/leaderboard should return privacy-safe driver standings', async () => {
    const res = await request(app)
      .get('/api/leaderboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/reports/weekly should compare current and previous period', async () => {
    const res = await request(app)
      .get('/api/reports/weekly')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.currentWeek).toBeDefined();
  });

});
