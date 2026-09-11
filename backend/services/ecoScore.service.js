const { ECO_SCORE } = require('../utils/constants');

function calculateEcoScore(trip, vehicle) {
  const distanceKm = Math.max(0.1, Number(trip.distanceKm) || 1);
  const durationMin = Math.max(0.1, Number(trip.durationMin) || 1);
  const avgSpeed = Number(trip.avgSpeedKmh) || (distanceKm / (durationMin / 60));
  const maxSpeed = Number(trip.maxSpeedKmh) || (avgSpeed * 1.2);
  const idleTimeMin = Math.max(0, Number(trip.idleTimeMin) || 0);
  const hardAcc = Math.max(0, Number(trip.hardAccelerationCount) || 0);
  const hardBrake = Math.max(0, Number(trip.hardBrakingCount) || 0);

  // 1. Acceleration Score (25%)
  const accEventsPer10Km = (hardAcc / distanceKm) * 10;
  const accelerationScore = Math.max(0, Math.min(100, 100 - (accEventsPer10Km * 25)));

  // 2. Braking Score (20%)
  const brakeEventsPer10Km = (hardBrake / distanceKm) * 10;
  const brakingScore = Math.max(0, Math.min(100, 100 - (brakeEventsPer10Km * 25)));

  // 3. Idle Score (15%)
  const idleRatio = Math.min(1, idleTimeMin / durationMin);
  const idleScore = Math.max(0, Math.min(100, 100 - (idleRatio * 200)));

  // 4. Speed Consistency Score (15%)
  const speedRatio = avgSpeed > 0 ? maxSpeed / avgSpeed : 1.2;
  let speedConsistencyScore = 90;
  if (speedRatio > 2.0) {
    speedConsistencyScore = 40;
  } else if (speedRatio > 1.6) {
    speedConsistencyScore = 65;
  } else if (speedRatio > 1.3) {
    speedConsistencyScore = 85;
  } else {
    speedConsistencyScore = 95;
  }

  // 5. Efficiency Score (15%)
  let efficiencyScore = 80;
  if (vehicle) {
    if (vehicle.fuelType === 'EV' && trip.energyConsumedKwh && distanceKm > 0) {
      const actualKwhPer100km = (Number(trip.energyConsumedKwh) / distanceKm) * 100;
      const expectedKwhPer100km = vehicle.energyEfficiency || 18;
      const ratio = actualKwhPer100km / expectedKwhPer100km;
      efficiencyScore = Math.max(0, Math.min(100, 100 - ((ratio - 1) * 50)));
    } else if (trip.fuelConsumedL && distanceKm > 0) {
      const actualLPer100km = (Number(trip.fuelConsumedL) / distanceKm) * 100;
      const expectedLPer100km = vehicle.fuelEfficiency || 8.0;
      const ratio = actualLPer100km / expectedLPer100km;
      efficiencyScore = Math.max(0, Math.min(100, 100 - ((ratio - 1) * 50)));
    }
  }

  // 6. Route Efficiency Score (10%)
  const routeEfficiencyScore = 90;

  const weights = ECO_SCORE.WEIGHTS;
  const weightedSum =
    (accelerationScore * weights.ACCELERATION) +
    (brakingScore * weights.BRAKING) +
    (idleScore * weights.IDLE) +
    (speedConsistencyScore * weights.SPEED_CONSISTENCY) +
    (efficiencyScore * weights.EFFICIENCY) +
    (routeEfficiencyScore * weights.ROUTE_EFFICIENCY);

  const ecoScore = Math.round(Math.max(0, Math.min(100, weightedSum)));

  let category = ECO_SCORE.CATEGORIES.find(c => ecoScore >= c.min && ecoScore <= c.max);
  if (!category) category = ECO_SCORE.CATEGORIES[ECO_SCORE.CATEGORIES.length - 1];

  return {
    ecoScore,
    category: category.label,
    categoryColor: category.color,
    scoreBreakdown: {
      acceleration: Math.round(accelerationScore),
      braking: Math.round(brakingScore),
      idle: Math.round(idleScore),
      speedConsistency: Math.round(speedConsistencyScore),
      efficiency: Math.round(efficiencyScore),
      routeEfficiency: Math.round(routeEfficiencyScore)
    }
  };
}

module.exports = { calculateEcoScore };
