const mongoose = require('mongoose');

const WeeklyReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: Date, required: true },
  totalTrips: { type: Number, default: 0 },
  totalDistanceKm: { type: Number, default: 0 },
  totalFuelL: { type: Number, default: 0 },
  totalEnergyKwh: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  totalCo2Kg: { type: Number, default: 0 },
  avgEcoScore: { type: Number, default: 0 },
  bestTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
  weakestTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
  improvementPct: { type: Number, default: 0 },
  estimatedSavings: { type: Number, default: 0 },
  recommendations: [{ type: String }]
}, {
  timestamps: true
});

WeeklyReportSchema.index({ userId: 1, weekStartDate: -1 });

module.exports = mongoose.model('WeeklyReport', WeeklyReportSchema);
