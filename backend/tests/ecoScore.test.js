const { calculateEcoScore } = require('../services/ecoScore.service');
const { calculateFuelAndEnergy } = require('../services/fuel.service');
const { calculateEmissions } = require('../services/emissions.service');
const { validateTrip, validateVehicle } = require('../utils/validators');

describe('EcoDrive Canonical Calculation Engines', () => {

  describe('Eco Score Engine', () => {
    test('Perfect driving should score 90+', () => {
      const trip = {
        distanceKm: 20,
        durationMin: 25,
        avgSpeedKmh: 48,
        maxSpeedKmh: 65,
        idleTimeMin: 0,
        hardAccelerationCount: 0,
        hardBrakingCount: 0
      };
      const vehicle = { fuelType: 'EV', energyEfficiency: 16 };
      const result = calculateEcoScore(trip, vehicle);
      expect(result.ecoScore).toBeGreaterThanOrEqual(90);
      expect(result.category).toBe('Excellent');
    });

    test('Aggressive driving with high idling should yield a lower score', () => {
      const trip = {
        distanceKm: 10,
        durationMin: 30,
        avgSpeedKmh: 20,
        maxSpeedKmh: 80,
        idleTimeMin: 12,
        hardAccelerationCount: 5,
        hardBrakingCount: 4
      };
      const vehicle = { fuelType: 'ICE', fuelEfficiency: 8 };
      const result = calculateEcoScore(trip, vehicle);
      expect(result.ecoScore).toBeLessThan(70);
      expect(['Fair', 'Needs Improvement']).toContain(result.category);
    });
  });

  describe('Fuel, Energy & Emissions Engine', () => {
    test('Calculates fuel cost and emissions for ICE vehicle accurately', () => {
      const trip = { distanceKm: 100, fuelConsumedL: 8.0 };
      const vehicle = { fuelType: 'ICE', fuelEfficiency: 8.0 };
      const userSettings = { fuelPriceUsd: 1.50 };

      const fuelRes = calculateFuelAndEnergy(trip, vehicle, userSettings);
      expect(fuelRes.fuelCost).toBe(12.00); // 8.0 L * $1.50

      const emissionsRes = calculateEmissions(fuelRes, vehicle);
      expect(emissionsRes.co2EmissionsKg).toBe(18.48); // 8.0 * 2.31 kg CO2/L
      expect(emissionsRes.label).toBe('Estimated CO2');
    });

    test('Calculates energy cost and grid emissions for EV vehicle accurately', () => {
      const trip = { distanceKm: 100, energyConsumedKwh: 15.0 };
      const vehicle = { fuelType: 'EV', energyEfficiency: 15.0 };
      const userSettings = { electricityPriceUsd: 0.20 };

      const fuelRes = calculateFuelAndEnergy(trip, vehicle, userSettings);
      expect(fuelRes.fuelCost).toBe(3.00); // 15.0 kWh * $0.20

      const emissionsRes = calculateEmissions(fuelRes, vehicle);
      expect(emissionsRes.co2EmissionsKg).toBe(6.00); // 15.0 * 0.40 kg CO2/kWh
    });
  });

  describe('Validators', () => {
    test('Rejects trip with negative distance or duration', () => {
      const invalidTrip = { vehicleId: 'v123', distanceKm: -5, durationMin: 0 };
      const val = validateTrip(invalidTrip);
      expect(val.isValid).toBe(false);
      expect(val.errors.length).toBeGreaterThan(0);
    });

    test('Rejects maxSpeed less than avgSpeed', () => {
      const invalidTrip = { vehicleId: 'v123', distanceKm: 10, durationMin: 15, avgSpeedKmh: 60, maxSpeedKmh: 40 };
      const val = validateTrip(invalidTrip);
      expect(val.isValid).toBe(false);
      expect(val.errors).toContain('Maximum speed cannot be less than average speed.');
    });

    test('Validates vehicle year and make', () => {
      const invalidVehicle = { make: '', model: 'Civic', year: 1850, fuelType: 'INVALID' };
      const val = validateVehicle(invalidVehicle);
      expect(val.isValid).toBe(false);
    });
  });

});
