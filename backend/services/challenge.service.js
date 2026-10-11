const Challenge = require('../models/Challenge');
const UserChallenge = require('../models/UserChallenge');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const { XP_EVENTS, LEVEL_XP_STEP } = require('../utils/constants');

async function getChallenges(userId) {
  let challenges = await Challenge.find({ active: true }).lean();

  // If no challenges exist in DB, automatically seed the 4 default behavior challenges
  if (challenges.length === 0) {
    const defaultChallenges = [
      {
        code: 'ECO_MASTER_1',
        title: 'Eco Master',
        description: 'Achieve an EcoScore of 80 or higher on 3 different trips.',
        category: 'eco_score',
        targetMetric: 'ecoScore',
        targetValue: 3,
        rewardXp: 150,
        icon: 'award',
        active: true
      },
      {
        code: 'ZERO_IDLE_1',
        title: 'Zero Idle Champion',
        description: 'Complete 2 trips with 0 idling at intersections.',
        category: 'idle_reduction',
        targetMetric: 'idleReduction',
        targetValue: 2,
        rewardXp: 100,
        icon: 'clock',
        active: true
      },
      {
        code: 'SMOOTH_DRIVER_1',
        title: 'Smooth Driver',
        description: 'Log 3 trips with fewer than 3 hard acceleration events.',
        category: 'smooth_driving',
        targetMetric: 'hardAcc',
        targetValue: 3,
        rewardXp: 120,
        icon: 'trending-up',
        active: true
      },
      {
        code: 'ROAD_WARRIOR_1',
        title: 'Road Warrior',
        description: 'Log at least 5 trips in a single calendar week.',
        category: 'trip_count',
        targetMetric: 'tripCount',
        targetValue: 5,
        rewardXp: 200,
        icon: 'map-pin',
        active: true
      }
    ];
    await Challenge.insertMany(defaultChallenges);
    challenges = await Challenge.find({ active: true }).lean();
  }

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
