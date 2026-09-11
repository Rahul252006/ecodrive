const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/trends', analyticsController.getTrends);

module.exports = router;
