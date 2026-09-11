const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challenge.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', challengeController.getChallenges);
router.post('/:id/join', challengeController.joinChallenge);

module.exports = router;
