const mongoose = require('mongoose');
const { VEHICLE_TYPES } = require('../utils/constants');

const VehicleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  make: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  fuelType: { 
    type: String, 
    enum: Object.values(VEHICLE_TYPES), 
    default: VEHICLE_TYPES.ICE 
  },
  fuelEfficiency: { type: Number, default: 8.0 }, // L/100km
  energyEfficiency: { type: Number, default: 18.0 }, // kWh/100km
  batteryCapacity: { type: Number, default: 60.0 }, // kWh
  defaultVehicle: { type: Boolean, default: false }
}, {
  timestamps: true
});

VehicleSchema.index({ userId: 1 });
VehicleSchema.index({ userId: 1, defaultVehicle: 1 });

module.exports = mongoose.model('Vehicle', VehicleSchema);
