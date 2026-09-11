const tripService = require('../services/trip.service');

async function createTrip(req, res, next) {
  try {
    const result = await tripService.createTrip(req.user.id, req.body);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function getTrips(req, res, next) {
  try {
    const trips = await tripService.getTrips(req.user.id, req.query);
    res.json({
      success: true,
      data: trips
    });
  } catch (err) {
    next(err);
  }
}

async function getTripById(req, res, next) {
  try {
    const trip = await tripService.getTripById(req.user.id, req.params.id);
    res.json({
      success: true,
      data: trip
    });
  } catch (err) {
    next(err);
  }
}

async function deleteTrip(req, res, next) {
  try {
    const result = await tripService.deleteTrip(req.user.id, req.params.id);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  deleteTrip
};
