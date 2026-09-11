const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['eco_score', 'idle_reduction', 'smooth_driving', 'co2_reduction', 'trip_count'], 
    required: true 
  },
  targetValue: { type: Number, required: true },
  targetMetric: { type: String, required: true }, // e.g. 'ecoScore', 'tripCount', 'hardAcc'
  rewardXp: { type: Number, default: 100 },
  icon: { type: String, default: 'trophy' },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Challenge', ChallengeSchema);
