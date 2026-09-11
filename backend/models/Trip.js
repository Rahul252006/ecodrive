const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  tripDate: { type: Date, default: Date.now },
  startLocation: { type: String, default: 'Starting Point' },
  endLocation: { type: String, default: 'Destination' },
  distanceKm: { type: Number, required: true },
  durationMin: { type: Number, required: true },
  avgSpeedKmh: { type: Number, default: 0 },
  maxSpeedKmh: { type: Number, default: 0 },
  idleTimeMin: { type: Number, default: 0 },
  hardAccelerationCount: { type: Number, default: 0 },
  hardBrakingCount: { type: Number, default: 0 },
  fuelConsumedL: { type: Number, default: null },
  energyConsumedKwh: { type: Number, default: null },
  ecoScore: { type: Number, required: true },
  category: { type: String, default: 'Good' },
  scoreBreakdown: {
    acceleration: { type: Number, default: 100 },
    braking: { type: Number, default: 100 },
    idle: { type: Number, default: 100 },
    speedConsistency: { type: Number, default: 90 },
    efficiency: { type: Number, default: 80 },
    routeEfficiency: { type: Number, default: 90 }
  },
  fuelCost: { type: Number, default: 0 },
  co2EmissionsKg: { type: Number, default: 0 },
  recommendations: [{ type: String }],
  mlModelName: { type: String, default: 'Trained ML Model (eco_driving_model.joblib)' },
  mlPredictedFuelL: { type: Number, default: 0 },
  mlVariancePct: { type: Number, default: 0 },
  mlInsightText: { type: String, default: '' },
  provenance: {
    distance: { type: String, default: 'user-provided' },
    duration: { type: String, default: 'user-provided' },
    consumption: { type: String, default: 'user-provided' },
    ecoScore: { type: String, default: 'derived' },
    emissions: { type: String, default: 'estimated' }
  }
}, {
  timestamps: true
});

TripSchema.index({ userId: 1, tripDate: -1 });
TripSchema.index({ vehicleId: 1 });
TripSchema.index({ userId: 1, ecoScore: -1 });

module.exports = mongoose.model('Trip', TripSchema);
