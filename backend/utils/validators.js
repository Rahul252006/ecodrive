const { VEHICLE_TYPES } = require('./constants');

function validateTrip(tripData) {
  const errors = [];

  if (!tripData.vehicleId) {
    errors.push('Vehicle selection is required.');
  }

  const distance = Number(tripData.distanceKm);
  if (isNaN(distance) || distance <= 0) {
    errors.push('Distance must be a number greater than 0 km.');
  }

  const duration = Number(tripData.durationMin);
  if (isNaN(duration) || duration <= 0) {
    errors.push('Duration must be a number greater than 0 minutes.');
  }

  if (tripData.avgSpeedKmh !== undefined && tripData.avgSpeedKmh !== null && tripData.avgSpeedKmh !== '') {
    const avgSpeed = Number(tripData.avgSpeedKmh);
    if (isNaN(avgSpeed) || avgSpeed < 0) {
      errors.push('Average speed cannot be negative.');
    }
  }

  if (tripData.maxSpeedKmh !== undefined && tripData.maxSpeedKmh !== null && tripData.maxSpeedKmh !== '') {
    const maxSpeed = Number(tripData.maxSpeedKmh);
    const avgSpeed = Number(tripData.avgSpeedKmh || 0);
    if (isNaN(maxSpeed) || maxSpeed < 0) {
      errors.push('Maximum speed cannot be negative.');
    }
    if (maxSpeed < avgSpeed) {
      errors.push('Maximum speed cannot be less than average speed.');
    }
  }

  if (tripData.idleTimeMin !== undefined && tripData.idleTimeMin !== null && tripData.idleTimeMin !== '') {
    const idleTime = Number(tripData.idleTimeMin);
    if (isNaN(idleTime) || idleTime < 0) {
      errors.push('Idle time cannot be negative.');
    }
    if (!isNaN(duration) && idleTime > duration) {
      errors.push('Idle time cannot exceed trip duration.');
    }
  }

  if (tripData.fuelConsumedL !== undefined && tripData.fuelConsumedL !== null && tripData.fuelConsumedL !== '') {
    const fuel = Number(tripData.fuelConsumedL);
    if (isNaN(fuel) || fuel < 0) {
      errors.push('Fuel consumed cannot be negative.');
    }
  }

  if (tripData.energyConsumedKwh !== undefined && tripData.energyConsumedKwh !== null && tripData.energyConsumedKwh !== '') {
    const energy = Number(tripData.energyConsumedKwh);
    if (isNaN(energy) || energy < 0) {
      errors.push('Energy consumed cannot be negative.');
    }
  }

  if (tripData.hardAccelerationCount !== undefined && tripData.hardAccelerationCount !== null && tripData.hardAccelerationCount !== '') {
    const hardAcc = Number(tripData.hardAccelerationCount);
    if (isNaN(hardAcc) || hardAcc < 0) {
      errors.push('Hard acceleration count cannot be negative.');
    }
  }

  if (tripData.hardBrakingCount !== undefined && tripData.hardBrakingCount !== null && tripData.hardBrakingCount !== '') {
    const hardBrake = Number(tripData.hardBrakingCount);
    if (isNaN(hardBrake) || hardBrake < 0) {
      errors.push('Hard braking count cannot be negative.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateVehicle(vehicleData) {
  const errors = [];

  if (!vehicleData.make || typeof vehicleData.make !== 'string' || !vehicleData.make.trim()) {
    errors.push('Vehicle make is required.');
  }

  if (!vehicleData.model || typeof vehicleData.model !== 'string' || !vehicleData.model.trim()) {
    errors.push('Vehicle model is required.');
  }

  const currentYear = new Date().getFullYear();
  const year = Number(vehicleData.year);
  if (isNaN(year) || year < 1900 || year > currentYear + 1) {
    errors.push(`Year must be between 1900 and ${currentYear + 1}.`);
  }

  const validTypes = Object.values(VEHICLE_TYPES);
  if (!vehicleData.fuelType || !validTypes.includes(vehicleData.fuelType)) {
    errors.push(`Fuel type must be one of: ${validTypes.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateTrip,
  validateVehicle
};
