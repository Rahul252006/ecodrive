const Vehicle = require('../models/Vehicle');
const { validateVehicle } = require('../utils/validators');

async function getVehicles(req, res, next) {
  try {
    const vehicles = await Vehicle.find({ userId: req.user.id }).sort({ defaultVehicle: -1, createdAt: -1 });
    res.json({
      success: true,
      data: vehicles
    });
  } catch (err) {
    next(err);
  }
}

async function getVehicleById(req, res, next) {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Vehicle not found or unauthorized.' }
      });
    }
    res.json({
      success: true,
      data: vehicle
    });
  } catch (err) {
    next(err);
  }
}

async function createVehicle(req, res, next) {
  try {
    const validation = validateVehicle(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validation.errors.join(' ') }
      });
    }

    const existingVehiclesCount = await Vehicle.countDocuments({ userId: req.user.id });
    const isDefault = req.body.defaultVehicle || existingVehiclesCount === 0;

    if (isDefault) {
      await Vehicle.updateMany({ userId: req.user.id }, { defaultVehicle: false });
    }

    const vehicle = new Vehicle({
      userId: req.user.id,
      make: req.body.make.trim(),
      model: req.body.model.trim(),
      year: Number(req.body.year),
      fuelType: req.body.fuelType,
      fuelEfficiency: Number(req.body.fuelEfficiency || 8.0),
      energyEfficiency: Number(req.body.energyEfficiency || 18.0),
      batteryCapacity: Number(req.body.batteryCapacity || 60.0),
      defaultVehicle: isDefault
    });

    await vehicle.save();

    res.status(201).json({
      success: true,
      data: vehicle
    });
  } catch (err) {
    next(err);
  }
}

async function updateVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Vehicle not found or unauthorized.' }
      });
    }

    const validation = validateVehicle({ ...vehicle.toObject(), ...req.body });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validation.errors.join(' ') }
      });
    }

    if (req.body.defaultVehicle && !vehicle.defaultVehicle) {
      await Vehicle.updateMany({ userId: req.user.id }, { defaultVehicle: false });
      vehicle.defaultVehicle = true;
    }

    if (req.body.make) vehicle.make = req.body.make.trim();
    if (req.body.model) vehicle.model = req.body.model.trim();
    if (req.body.year) vehicle.year = Number(req.body.year);
    if (req.body.fuelType) vehicle.fuelType = req.body.fuelType;
    if (req.body.fuelEfficiency !== undefined) vehicle.fuelEfficiency = Number(req.body.fuelEfficiency);
    if (req.body.energyEfficiency !== undefined) vehicle.energyEfficiency = Number(req.body.energyEfficiency);
    if (req.body.batteryCapacity !== undefined) vehicle.batteryCapacity = Number(req.body.batteryCapacity);

    await vehicle.save();

    res.json({
      success: true,
      data: vehicle
    });
  } catch (err) {
    next(err);
  }
}

async function deleteVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Vehicle not found or unauthorized.' }
      });
    }

    // If deleted vehicle was default, set another vehicle as default
    if (vehicle.defaultVehicle) {
      const remaining = await Vehicle.findOne({ userId: req.user.id });
      if (remaining) {
        remaining.defaultVehicle = true;
        await remaining.save();
      }
    }

    res.json({
      success: true,
      data: { id: req.params.id, message: 'Vehicle removed successfully.' }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
