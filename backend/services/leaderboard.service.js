const User = require('../models/User');
const Trip = require('../models/Trip');

async function getLeaderboard(category = 'eco_score') {
  // 1. Fetch all users who have not opted out
  const users = await User.find({ 'privacySettings.optOutLeaderboard': { $ne: true } })
    .select('name xp level streak privacySettings createdAt')
    .lean();

  const userIds = users.map(u => u._id);

  // 2. Fetch trips for these users
  const trips = await Trip.find({ userId: { $in: userIds } })
    .select('userId ecoScore co2EmissionsKg distanceKm fuelCost tripDate')
    .lean();

  // Aggregate stats per user
  const userStats = {};
  users.forEach(u => {
    const idStr = u._id.toString();
    const displayName = u.privacySettings?.displayName || u.name;
    const isHidden = u.privacySettings?.hideProfile;

    userStats[idStr] = {
      userId: idStr,
      displayName: isHidden ? 'Anonymous Driver' : displayName,
      level: u.level || 1,
      xp: u.xp || 0,
      streak: u.streak || 0,
      totalTrips: 0,
      sumEcoScore: 0,
      avgEcoScore: 0,
      totalCo2SavedKg: 0,
      totalDistanceKm: 0
    };
  });

  trips.forEach(t => {
    const idStr = t.userId.toString();
    if (userStats[idStr]) {
      userStats[idStr].totalTrips += 1;
      userStats[idStr].sumEcoScore += t.ecoScore;
      userStats[idStr].totalDistanceKm += t.distanceKm;
      
      // Calculate estimated CO2 saved compared to average un-optimized baseline (0.22kg/km)
      const baselineCo2 = t.distanceKm * 0.22;
      const saved = Math.max(0, baselineCo2 - t.co2EmissionsKg);
      userStats[idStr].totalCo2SavedKg += saved;
    }
  });

  const list = Object.values(userStats).map(stat => {
    stat.avgEcoScore = stat.totalTrips > 0 ? Math.round(stat.sumEcoScore / stat.totalTrips) : 0;
    stat.totalCo2SavedKg = Number(stat.totalCo2SavedKg.toFixed(2));
    return stat;
  });

  // Sort according to category
  if (category === 'co2_reduction') {
    list.sort((a, b) => b.totalCo2SavedKg - a.totalCo2SavedKg);
  } else if (category === 'xp') {
    list.sort((a, b) => b.xp - a.xp);
  } else if (category === 'streak') {
    list.sort((a, b) => b.streak - a.streak);
  } else {
    // default: eco_score
    list.sort((a, b) => b.avgEcoScore - a.avgEcoScore);
  }

  // Assign rank
  return list.map((item, idx) => ({
    rank: idx + 1,
    ...item
  }));
}

module.exports = { getLeaderboard };
