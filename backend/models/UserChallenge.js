const mongoose = require('mongoose');

const UserChallengeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null }
}, {
  timestamps: true
});

UserChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true });
UserChallengeSchema.index({ userId: 1, completed: 1 });

module.exports = mongoose.model('UserChallenge', UserChallengeSchema);
