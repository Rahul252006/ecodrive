const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-passwordHash').lean();
    const vehicles = await Vehicle.find({ userId }).lean();
    const trips = await Trip.find({ userId }).sort({ tripDate: -1 }).lean();

    if (trips.length === 0) {
      return res.json({
        success: true,
        data: {
          hasData: false,
          user: {
            name: user.name,
            goal: user.goal,
            xp: user.xp,
            level: user.level,
            streak: user.streak
          },
          vehiclesCount: vehicles.length,
          stats: {
            totalTrips: 0,
            totalDistanceKm: 0,
            avgEcoScore: 0,
            category: 'N/A',
            totalCost: 0,
            totalCo2Kg: 0,
            totalFuelL: 0,
            totalEnergyKwh: 0,
            scoreBreakdown: {
              acceleration: 0,
              braking: 0,
              idle: 0,
              speedConsistency: 0,
              efficiency: 0,
              routeEfficiency: 0
            }
          },
          recentTrips: []
        }
      });
    }

    const totalTrips = trips.length;
    const totalDistanceKm = Number(trips.reduce((acc, t) => acc + (t.distanceKm || 0), 0).toFixed(1));
    const totalCost = Number(trips.reduce((acc, t) => acc + (t.fuelCost || 0), 0).toFixed(2));
    const totalCo2Kg = Number(trips.reduce((acc, t) => acc + (t.co2EmissionsKg || 0), 0).toFixed(2));
    const totalFuelL = Number(trips.reduce((acc, t) => acc + (t.fuelConsumedL || 0), 0).toFixed(1));
    const totalEnergyKwh = Number(trips.reduce((acc, t) => acc + (t.energyConsumedKwh || 0), 0).toFixed(1));

    const avgEcoScore = Math.round(trips.reduce((acc, t) => acc + t.ecoScore, 0) / totalTrips);

    const avgBreakdown = {
      acceleration: Math.round(trips.reduce((acc, t) => acc + (t.scoreBreakdown?.acceleration || 80), 0) / totalTrips),
      braking: Math.round(trips.reduce((acc, t) => acc + (t.scoreBreakdown?.braking || 80), 0) / totalTrips),
      idle: Math.round(trips.reduce((acc, t) => acc + (t.scoreBreakdown?.idle || 80), 0) / totalTrips),
      speedConsistency: Math.round(trips.reduce((acc, t) => acc + (t.scoreBreakdown?.speedConsistency || 80), 0) / totalTrips),
      efficiency: Math.round(trips.reduce((acc, t) => acc + (t.scoreBreakdown?.efficiency || 80), 0) / totalTrips),
      routeEfficiency: Math.round(trips.reduce((acc, t) => acc + (t.scoreBreakdown?.routeEfficiency || 80), 0) / totalTrips)
    };

    let category = 'Good';
    if (avgEcoScore >= 90) category = 'Excellent';
    else if (avgEcoScore >= 75) category = 'Good';
    else if (avgEcoScore >= 60) category = 'Fair';
    else category = 'Needs Improvement';

    res.json({
      success: true,
      data: {
        hasData: true,
        user: {
          name: user.name,
          goal: user.goal,
          xp: user.xp,
          level: user.level,
          streak: user.streak
        },
        vehiclesCount: vehicles.length,
        stats: {
          totalTrips,
          totalDistanceKm,
          avgEcoScore,
          category,
          totalCost,
          totalCo2Kg,
          totalFuelL,
          totalEnergyKwh,
          scoreBreakdown: avgBreakdown
        },
        recentTrips: trips.slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getTrends(req, res, next) {
  try {
    const userId = req.user.id;
    const days = Number(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trips = await Trip.find({
      userId,
      tripDate: { $gte: startDate }
    }).sort({ tripDate: 1 }).lean();

    // Aggregate trends by date
    const dateMap = {};
    trips.forEach(t => {
      const dateStr = new Date(t.tripDate).toISOString().split('T')[0];
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {
          date: dateStr,
          tripsCount: 0,
          scores: [],
          distanceKm: 0,
          fuelCost: 0,
          co2Kg: 0
        };
      }
      dateMap[dateStr].tripsCount += 1;
      dateMap[dateStr].scores.push(t.ecoScore);
      dateMap[dateStr].distanceKm += t.distanceKm || 0;
      dateMap[dateStr].fuelCost += t.fuelCost || 0;
      dateMap[dateStr].co2Kg += t.co2EmissionsKg || 0;
    });

    const trendPoints = Object.values(dateMap).map(d => ({
      date: d.date,
      tripsCount: d.tripsCount,
      avgEcoScore: Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length),
      distanceKm: Number(d.distanceKm.toFixed(1)),
      fuelCost: Number(d.fuelCost.toFixed(2)),
      co2Kg: Number(d.co2Kg.toFixed(2))
    }));

    res.json({
      success: true,
      data: {
        periodDays: days,
        points: trendPoints
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard, getTrends };
