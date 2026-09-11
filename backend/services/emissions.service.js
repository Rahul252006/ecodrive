const { EMISSIONS_FACTORS, VEHICLE_TYPES } = require('../utils/constants');

function calculateEmissions(fuelAndEnergy, vehicle) {
  const isEv = vehicle && vehicle.fuelType === VEHICLE_TYPES.EV;
  let co2EmissionsKg = 0;
  let calculationMethod = '';

  if (isEv) {
    const energyKwh = fuelAndEnergy.energyConsumedKwh || 0;
    const factor = EMISSIONS_FACTORS.EV_GRID_KG_PER_KWH;
    co2EmissionsKg = Number((energyKwh * factor).toFixed(2));
    calculationMethod = `Grid average emission factor: ${factor} kg CO2 / kWh`;
  } else {
    const fuelL = fuelAndEnergy.fuelConsumedL || 0;
    const factor = EMISSIONS_FACTORS.ICE_GASOLINE_KG_PER_L;
    co2EmissionsKg = Number((fuelL * factor).toFixed(2));
    calculationMethod = `Standard gasoline combustion factor: ${factor} kg CO2 / L`;
  }

  return {
    co2EmissionsKg,
    label: 'Estimated CO2',
    calculationMethod
  };
}

module.exports = { calculateEmissions };
