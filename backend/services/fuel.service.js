const { DEFAULT_PRICES, VEHICLE_TYPES } = require('../utils/constants');

function calculateFuelAndEnergy(trip, vehicle, userSettings = {}) {
  const distanceKm = Number(trip.distanceKm) || 0;
  const isEv = vehicle && vehicle.fuelType === VEHICLE_TYPES.EV;
  
  const fuelPrice = userSettings.fuelPriceUsd ?? DEFAULT_PRICES.FUEL_USD_PER_L;
  const electricityPrice = userSettings.electricityPriceUsd ?? DEFAULT_PRICES.ELECTRICITY_USD_PER_KWH;

  let fuelConsumedL = trip.fuelConsumedL !== undefined && trip.fuelConsumedL !== null ? Number(trip.fuelConsumedL) : null;
  let energyConsumedKwh = trip.energyConsumedKwh !== undefined && trip.energyConsumedKwh !== null ? Number(trip.energyConsumedKwh) : null;

  // Estimation fallbacks if not provided directly
  if (vehicle) {
    if (isEv) {
      if (energyConsumedKwh === null && distanceKm > 0) {
        const kwhPer100km = vehicle.energyEfficiency || 18.0;
        energyConsumedKwh = Number(((distanceKm * kwhPer100km) / 100).toFixed(2));
      }
    } else {
      if (fuelConsumedL === null && distanceKm > 0) {
        const lPer100km = vehicle.fuelEfficiency || 8.0;
        fuelConsumedL = Number(((distanceKm * lPer100km) / 100).toFixed(2));
      }
    }
  }

  let fuelCost = 0;
  let efficiencyText = 'N/A';

  if (isEv) {
    if (energyConsumedKwh !== null) {
      fuelCost = Number((energyConsumedKwh * electricityPrice).toFixed(2));
      if (energyConsumedKwh > 0 && distanceKm > 0) {
        const kmPerKwh = (distanceKm / energyConsumedKwh).toFixed(1);
        const kwhPer100km = ((energyConsumedKwh / distanceKm) * 100).toFixed(1);
        efficiencyText = `${kmPerKwh} km/kWh (${kwhPer100km} kWh/100km)`;
      }
    }
  } else {
    if (fuelConsumedL !== null) {
      fuelCost = Number((fuelConsumedL * fuelPrice).toFixed(2));
      if (fuelConsumedL > 0 && distanceKm > 0) {
        const kmPerL = (distanceKm / fuelConsumedL).toFixed(1);
        const lPer100km = ((fuelConsumedL / distanceKm) * 100).toFixed(1);
        efficiencyText = `${kmPerL} km/L (${lPer100km} L/100km)`;
      }
    }
  }

  return {
    fuelConsumedL,
    energyConsumedKwh,
    fuelCost,
    efficiencyText,
    unitPriceUsed: isEv ? electricityPrice : fuelPrice,
    isEstimate: (isEv && trip.energyConsumedKwh === undefined) || (!isEv && trip.fuelConsumedL === undefined)
  };
}

module.exports = { calculateFuelAndEnergy };
