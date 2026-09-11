const Challenge = require('../models/Challenge');
const UserChallenge = require('../models/UserChallenge');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const { XP_EVENTS, LEVEL_XP_STEP } = require('../utils/constants');

async function getChallenges(userId) {
  const challenges = await Challenge.find({ active: true }).lean();
  const userChallenges = await UserChallenge.find({ userId }).lean();

  const joinedMap = {};
  userChallenges.forEach(uc => {
    joinedMap[uc.challengeId.toString()] = uc;
  });

  return challenges.map(c => {
    const uc = joinedMap[c._id.toString()];
    return {
      ...c,
      joined: !!uc,
      progress: uc ? uc.progress : 0,
      completed: uc ? uc.completed : false,
      completedAt: uc ? uc.completedAt : null
    };
  });
}

async function joinChallenge(userId, challengeId) {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    const err = new Error('Challenge not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  let uc = await UserChallenge.findOne({ userId, challengeId });
  if (uc) {
    return uc;
  }

  uc = new UserChallenge({
    userId,
    challengeId,
    progress: 0,
    completed: false
  });
  await uc.save();
  return uc;
}

async function updateChallengeProgress(userId, trip) {
  const userChallenges = await UserChallenge.find({ userId, completed: false }).populate('challengeId');

  for (const uc of userChallenges) {
    const ch = uc.challengeId;
    if (!ch || !ch.active) continue;

    let progressMade = false;

    if (ch.targetMetric === 'ecoScore' && trip.ecoScore >= 80) {
      uc.progress += 1;
      progressMade = true;
    } else if (ch.targetMetric === 'tripCount') {
      uc.progress += 1;
      progressMade = true;
    } else if (ch.targetMetric === 'hardAcc' && trip.hardAccelerationCount < 3) {
      uc.progress += 1;
      progressMade = true;
    } else if (ch.targetMetric === 'idleReduction' && trip.idleTimeMin === 0) {
      uc.progress += 1;
      progressMade = true;
    }

    if (progressMade) {
      if (uc.progress >= ch.targetValue) {
        uc.completed = true;
        uc.completedAt = new Date();

        // Award reward XP
        const user = await User.findById(userId);
        if (user) {
          user.xp += ch.rewardXp || 100;
          user.level = Math.floor(user.xp / LEVEL_XP_STEP) + 1;
          await user.save();
        }

        // Add achievement
        try {
          await Achievement.create({
            userId,
            code: `CHALLENGE_${ch._id}`,
            title: `Completed: ${ch.title}`,
            description: ch.description,
            icon: ch.icon || 'trophy'
          });
        } catch (e) {
          // ignore duplicate achievement
        }
      }
      await uc.save();
    }
  }
}

module.exports = {
  getChallenges,
  joinChallenge,
  updateChallengeProgress
};
