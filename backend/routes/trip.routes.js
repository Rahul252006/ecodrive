const express = require('express');
const router = express.Router();
const tripController = require('../controllers/trip.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', tripController.getTrips);
router.post('/', tripController.createTrip);
router.get('/:id', tripController.getTripById);
router.delete('/:id', tripController.deleteTrip);

module.exports = router;
