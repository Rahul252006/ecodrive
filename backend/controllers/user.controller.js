const User = require('../models/User');
const Achievement = require('../models/Achievement');

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' }
      });
    }

    const achievements = await Achievement.find({ userId: req.user.id }).sort({ unlockedAt: -1 });

    res.json({
      success: true,
      data: {
        user,
        achievements
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const { name, goal, fuelPriceConfig, electricityPriceConfig, privacySettings } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' }
      });
    }

    if (name) user.name = name.trim();
    if (goal) user.goal = goal;
    if (fuelPriceConfig !== undefined) user.fuelPriceConfig = Number(fuelPriceConfig);
    if (electricityPriceConfig !== undefined) user.electricityPriceConfig = Number(electricityPriceConfig);
    
    if (privacySettings) {
      user.privacySettings = {
        displayName: privacySettings.displayName !== undefined ? privacySettings.displayName : user.privacySettings.displayName,
        hideProfile: privacySettings.hideProfile !== undefined ? privacySettings.hideProfile : user.privacySettings.hideProfile,
        optOutLeaderboard: privacySettings.optOutLeaderboard !== undefined ? privacySettings.optOutLeaderboard : user.privacySettings.optOutLeaderboard
      };
    }

    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          goal: user.goal,
          fuelPriceConfig: user.fuelPriceConfig,
          electricityPriceConfig: user.electricityPriceConfig,
          privacySettings: user.privacySettings
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateSettings };
