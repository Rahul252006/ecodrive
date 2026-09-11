const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: 'award' },
  unlockedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

AchievementSchema.index({ userId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', AchievementSchema);
