const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { validateTrip } = require('../utils/validators');
const { calculateEcoScore } = require('./ecoScore.service');
const { calculateFuelAndEnergy } = require('./fuel.service');
const { calculateEmissions } = require('./emissions.service');
const { generateCoaching } = require('./coaching.service');
const { predictExpectedFuelConsumption } = require('./ml.service');
const { updateChallengeProgress } = require('./challenge.service');
const { XP_EVENTS, LEVEL_XP_STEP } = require('../utils/constants');

async function createTrip(userId, tripData) {
  const validation = validateTrip(tripData);
  if (!validation.isValid) {
    const err = new Error(validation.errors.join(' '));
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.code = 'USER_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  let vehicle = await Vehicle.findOne({ _id: tripData.vehicleId, userId });
  if (!vehicle) {
    // Fallback to default vehicle if available
    vehicle = await Vehicle.findOne({ userId, defaultVehicle: true }) || await Vehicle.findOne({ userId });
    if (!vehicle) {
      const err = new Error('Selected vehicle not found for this user.');
      err.code = 'VEHICLE_NOT_FOUND';
      err.status = 404;
      throw err;
    }
  }

  // 1. Calculate Fuel & Energy
  const userSettings = {
    fuelPriceUsd: user.fuelPriceConfig,
    electricityPriceUsd: user.electricityPriceConfig
  };
  const fuelAndEnergy = calculateFuelAndEnergy(tripData, vehicle, userSettings);

  // 2. Calculate Eco Score
  const scoreResult = calculateEcoScore({
    ...tripData,
    fuelConsumedL: fuelAndEnergy.fuelConsumedL,
    energyConsumedKwh: fuelAndEnergy.energyConsumedKwh
  }, vehicle);

  // 3. Calculate Emissions
  const emissions = calculateEmissions(fuelAndEnergy, vehicle);

  // 4. Fetch personal historical baseline for coaching
  const userTrips = await Trip.find({ userId }).select('ecoScore').lean();
  const historicalAvgScore = userTrips.length > 0
    ? Math.round(userTrips.reduce((acc, t) => acc + t.ecoScore, 0) / userTrips.length)
    : null;

  // 5. Generate Coaching & ML Model Efficiency Insights
  const recommendations = generateCoaching(tripData, scoreResult, historicalAvgScore);
  const mlInsight = predictExpectedFuelConsumption(tripData, vehicle);
  if (mlInsight && mlInsight.insightText) {
    recommendations.unshift(`[ML Baseline Insight] ${mlInsight.insightText}`);
  }

  // 6. Construct Trip Record
  const newTrip = new Trip({
    userId,
    vehicleId: vehicle._id,
    tripDate: tripData.tripDate || new Date(),
    startLocation: tripData.startLocation || 'Starting Location',
    endLocation: tripData.endLocation || 'Destination',
    distanceKm: Number(tripData.distanceKm),
    durationMin: Number(tripData.durationMin),
    avgSpeedKmh: Number(tripData.avgSpeedKmh || (Number(tripData.distanceKm) / (Number(tripData.durationMin) / 60))),
    maxSpeedKmh: Number(tripData.maxSpeedKmh || (Number(tripData.avgSpeedKmh || 50) * 1.2)),
    idleTimeMin: Number(tripData.idleTimeMin || 0),
    hardAccelerationCount: Number(tripData.hardAccelerationCount || 0),
    hardBrakingCount: Number(tripData.hardBrakingCount || 0),
    fuelConsumedL: fuelAndEnergy.fuelConsumedL,
    energyConsumedKwh: fuelAndEnergy.energyConsumedKwh,
    ecoScore: scoreResult.ecoScore,
    category: scoreResult.category,
    scoreBreakdown: scoreResult.scoreBreakdown,
    fuelCost: fuelAndEnergy.fuelCost,
    co2EmissionsKg: emissions.co2EmissionsKg,
    recommendations,
    mlModelName: mlInsight.mlModelName,
    mlPredictedFuelL: mlInsight.mlPredictedFuelL,
    mlVariancePct: mlInsight.mlVariancePct,
    mlInsightText: mlInsight.mlInsightText,
    provenance: {
      distance: 'user-provided',
      duration: 'user-provided',
      consumption: fuelAndEnergy.isEstimate ? 'estimated' : 'user-provided',
      ecoScore: 'derived',
      emissions: 'estimated'
    }
  });

  await newTrip.save();

  // 7. Gamification: Award XP & update streak
  let xpAwarded = XP_EVENTS.TRIP_COMPLETED;
  if (scoreResult.ecoScore >= 90) {
    xpAwarded += XP_EVENTS.EXCELLENT_ECO_SCORE;
  }

  // Check streak
  const now = new Date();
  let newStreak = user.streak || 0;
  if (user.lastTripDate) {
    const diffDays = (now.getTime() - new Date(user.lastTripDate).getTime()) / (1000 * 3600 * 24);
    if (diffDays <= 2 && diffDays >= 0.5) {
      newStreak += 1;
      xpAwarded += XP_EVENTS.STREAK_BONUS;
    } else if (diffDays > 2) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  user.xp += xpAwarded;
  user.level = Math.floor(user.xp / LEVEL_XP_STEP) + 1;
  user.streak = newStreak;
  user.lastTripDate = now;
  await user.save();

  // 8. Update active challenges progress
  await updateChallengeProgress(userId, newTrip);

  return {
    trip: newTrip,
    xpAwarded,
    newLevel: user.level,
    newStreak: user.streak
  };
}

async function getTrips(userId, query = {}) {
  const filter = { userId };
  if (query.vehicleId) filter.vehicleId = query.vehicleId;
  if (query.startDate) filter.tripDate = { $gte: new Date(query.startDate) };

  return Trip.find(filter)
    .populate('vehicleId', 'make model year fuelType')
    .sort({ tripDate: -1 })
    .exec();
}

async function getTripById(userId, tripId) {
  const trip = await Trip.findOne({ _id: tripId, userId })
    .populate('vehicleId', 'make model year fuelType')
    .exec();
  if (!trip) {
    const err = new Error('Trip not found or unauthorized.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }
  return trip;
}

async function deleteTrip(userId, tripId) {
  const trip = await Trip.findOneAndDelete({ _id: tripId, userId });
  if (!trip) {
    const err = new Error('Trip not found or unauthorized.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }
  return { success: true };
}

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  deleteTrip
};
