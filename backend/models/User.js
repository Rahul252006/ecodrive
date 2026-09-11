const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: 'default_avatar.png' },
  goal: { type: String, enum: ['save_fuel', 'reduce_emissions', 'improve_skills', 'general'], default: 'save_fuel' },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  lastTripDate: { type: Date, default: null },
  privacySettings: {
    displayName: { type: String, default: '' },
    hideProfile: { type: Boolean, default: false },
    optOutLeaderboard: { type: Boolean, default: false }
  },
  fuelPriceConfig: { type: Number, default: 1.50 },
  electricityPriceConfig: { type: Number, default: 0.15 }
}, {
  timestamps: true
});

UserSchema.index({ xp: -1 });

module.exports = mongoose.model('User', UserSchema);
