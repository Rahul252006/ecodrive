const challengeService = require('../services/challenge.service');

async function getChallenges(req, res, next) {
  try {
    const challenges = await challengeService.getChallenges(req.user.id);
    res.json({
      success: true,
      data: challenges
    });
  } catch (err) {
    next(err);
  }
}

async function joinChallenge(req, res, next) {
  try {
    const uc = await challengeService.joinChallenge(req.user.id, req.params.id);
    res.json({
      success: true,
      data: uc
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getChallenges, joinChallenge };
