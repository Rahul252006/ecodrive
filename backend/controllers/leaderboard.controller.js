const leaderboardService = require('../services/leaderboard.service');

async function getLeaderboard(req, res, next) {
  try {
    const category = req.query.category || 'eco_score';
    const leaderboard = await leaderboardService.getLeaderboard(category);
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLeaderboard };
