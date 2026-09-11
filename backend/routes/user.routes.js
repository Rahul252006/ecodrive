const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/settings', authMiddleware, userController.updateSettings);

module.exports = router;
