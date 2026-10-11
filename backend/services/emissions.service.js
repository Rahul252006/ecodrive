const { EMISSIONS_FACTORS, VEHICLE_TYPES } = require('../utils/constants');

function calculateEmissions(fuelAndEnergy, vehicle) {
  const isEv = vehicle && vehicle.fuelType === VEHICLE_TYPES.EV;
  let co2EmissionsKg = 0;
  let tailpipeEmissionsKg = 0;
  let gridLifecycleEmissionsKg = 0;
  let calculationMethod = '';

  if (isEv) {
    const energyKwh = fuelAndEnergy.energyConsumedKwh || 0;
    const factor = EMISSIONS_FACTORS.EV_GRID_KG_PER_KWH;
    tailpipeEmissionsKg = 0; // Pure Electric Vehicles produce zero direct/tailpipe emissions
    gridLifecycleEmissionsKg = Number((energyKwh * factor).toFixed(2));
    co2EmissionsKg = gridLifecycleEmissionsKg;
    calculationMethod = `Zero Tailpipe Emissions (ZEV). Upstream grid charging generation: ${gridLifecycleEmissionsKg} kg CO2 (${factor} kg CO2 / kWh)`;
  } else {
    const fuelL = fuelAndEnergy.fuelConsumedL || 0;
    const factor = EMISSIONS_FACTORS.ICE_GASOLINE_KG_PER_L;
    tailpipeEmissionsKg = Number((fuelL * factor).toFixed(2));
    co2EmissionsKg = tailpipeEmissionsKg;
    calculationMethod = `Standard gasoline combustion factor: ${factor} kg CO2 / L`;
  }

  return {
    co2EmissionsKg,
    tailpipeEmissionsKg,
    gridLifecycleEmissionsKg,
    isEv,
    label: isEv ? '0 kg Tailpipe (Grid: ' + co2EmissionsKg + ' kg)' : 'Estimated CO2',
    calculationMethod
  };
}

module.exports = { calculateEmissions };
