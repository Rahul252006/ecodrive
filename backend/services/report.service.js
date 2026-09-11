const Trip = require('../models/Trip');

async function getWeeklyReport(userId) {
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - 7);

  const prevWeekStart = new Date(now);
  prevWeekStart.setDate(now.getDate() - 14);

  const currentTrips = await Trip.find({
    userId,
    tripDate: { $gte: currentWeekStart }
  }).sort({ ecoScore: -1 }).lean();

  const prevTrips = await Trip.find({
    userId,
    tripDate: { $gte: prevWeekStart, $lt: currentWeekStart }
  }).lean();

  const summarize = (tripsList) => {
    if (tripsList.length === 0) {
      return {
        count: 0,
        distanceKm: 0,
        fuelL: 0,
        energyKwh: 0,
        cost: 0,
        co2Kg: 0,
        avgEcoScore: 0
      };
    }
    const count = tripsList.length;
    const distanceKm = tripsList.reduce((acc, t) => acc + (t.distanceKm || 0), 0);
    const fuelL = tripsList.reduce((acc, t) => acc + (t.fuelConsumedL || 0), 0);
    const energyKwh = tripsList.reduce((acc, t) => acc + (t.energyConsumedKwh || 0), 0);
    const cost = tripsList.reduce((acc, t) => acc + (t.fuelCost || 0), 0);
    const co2Kg = tripsList.reduce((acc, t) => acc + (t.co2EmissionsKg || 0), 0);
    const avgEcoScore = Math.round(tripsList.reduce((acc, t) => acc + t.ecoScore, 0) / count);

    return {
      count,
      distanceKm: Number(distanceKm.toFixed(1)),
      fuelL: Number(fuelL.toFixed(1)),
      energyKwh: Number(energyKwh.toFixed(1)),
      cost: Number(cost.toFixed(2)),
      co2Kg: Number(co2Kg.toFixed(2)),
      avgEcoScore
    };
  };

  const currentSummary = summarize(currentTrips);
  const prevSummary = summarize(prevTrips);

  let improvementPct = 0;
  if (prevSummary.avgEcoScore > 0) {
    improvementPct = Number((((currentSummary.avgEcoScore - prevSummary.avgEcoScore) / prevSummary.avgEcoScore) * 100).toFixed(1));
  }

  const bestTrip = currentTrips.length > 0 ? currentTrips[0] : null;
  const weakestTrip = currentTrips.length > 0 ? currentTrips[currentTrips.length - 1] : null;

  const recommendations = [];
  if (currentSummary.avgEcoScore >= 80) {
    recommendations.push('Strong weekly driving efficiency! Keep up your gentle acceleration habits.');
  } else if (currentSummary.count > 0) {
    recommendations.push('Focus on reducing idle time and keeping steady cruising speeds to raise next week\'s average score.');
  } else {
    recommendations.push('No trips logged in the last 7 days. Log your upcoming drives to build your weekly efficiency trend!');
  }

  return {
    period: {
      startDate: currentWeekStart,
      endDate: now
    },
    currentWeek: currentSummary,
    previousWeek: prevSummary,
    improvementPct,
    bestTrip,
    weakestTrip,
    recommendations
  };
}

module.exports = { getWeeklyReport };
