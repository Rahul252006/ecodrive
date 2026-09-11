const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Challenge = require('../models/Challenge');
const UserChallenge = require('../models/UserChallenge');
const Achievement = require('../models/Achievement');
const tripService = require('../services/trip.service');

async function seed() {
  console.log('[Seed] Starting EcoDrive Database Seeding...');
  await connectDB();

  // Clean old collections
  await User.deleteMany({});
  await Vehicle.deleteMany({});
  await Trip.deleteMany({});
  await Challenge.deleteMany({});
  await UserChallenge.deleteMany({});
  await Achievement.deleteMany({});

  // 1. Create Default Challenges
  console.log('[Seed] Creating default behavior challenges...');
  const challenges = await Challenge.insertMany([
    {
      title: 'Eco Master',
      description: 'Log 5 trips with an Eco Score of 80 or higher.',
      category: 'eco_score',
      targetValue: 5,
      targetMetric: 'ecoScore',
      rewardXp: 150,
      icon: 'award'
    },
    {
      title: 'Zero Idle Champion',
      description: 'Complete 3 trips with zero idling time.',
      category: 'idle_reduction',
      targetValue: 3,
      targetMetric: 'idleReduction',
      rewardXp: 120,
      icon: 'clock'
    },
    {
      title: 'Smooth Driver',
      description: 'Complete 5 trips with fewer than 3 hard acceleration events.',
      category: 'smooth_driving',
      targetValue: 5,
      targetMetric: 'hardAcc',
      rewardXp: 100,
      icon: 'shield'
    },
    {
      title: 'Road Warrior',
      description: 'Complete 10 total trips on EcoDrive.',
      category: 'trip_count',
      targetValue: 10,
      targetMetric: 'tripCount',
      rewardXp: 200,
      icon: 'flag'
    }
  ]);

  // 2. Create Demo User
  console.log('[Seed] Creating demo user...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  const demoUser = await User.create({
    name: 'Alex Rivera',
    email: 'demo@ecodrive.com',
    passwordHash,
    goal: 'save_fuel',
    xp: 320,
    level: 2,
    streak: 4,
    fuelPriceConfig: 1.50,
    electricityPriceConfig: 0.15,
    privacySettings: {
      displayName: 'Alex (Eco Driver)',
      hideProfile: false,
      optOutLeaderboard: false
    }
  });

  // Create additional leaderboard users for realistic privacy-safe rankings
  const secondaryUsers = await User.insertMany([
    {
      name: 'Sarah Chen',
      email: 'sarah@ecodrive.com',
      passwordHash,
      xp: 650,
      level: 4,
      streak: 7,
      privacySettings: { displayName: 'Sarah C.', hideProfile: false, optOutLeaderboard: false }
    },
    {
      name: 'Marcus Vance',
      email: 'marcus@ecodrive.com',
      passwordHash,
      xp: 410,
      level: 3,
      streak: 2,
      privacySettings: { displayName: 'Marcus V.', hideProfile: false, optOutLeaderboard: false }
    },
    {
      name: 'Elena Rostova',
      email: 'elena@ecodrive.com',
      passwordHash,
      xp: 180,
      level: 1,
      streak: 1,
      privacySettings: { displayName: 'Anonymous Driver', hideProfile: true, optOutLeaderboard: false }
    }
  ]);

  // Join demo user into challenges
  for (const ch of challenges) {
    await UserChallenge.create({
      userId: demoUser._id,
      challengeId: ch._id,
      progress: ch.title === 'Eco Master' ? 3 : 1,
      completed: false
    });
  }

  // Add initial achievement for demo user
  await Achievement.create({
    userId: demoUser._id,
    code: 'FIRST_TRIP',
    title: 'First Journey',
    description: 'Logged your very first trip on EcoDrive!',
    icon: 'compass'
  });

  // 3. Create Vehicles for Demo User
  console.log('[Seed] Creating demo vehicles...');
  const teslaEV = await Vehicle.create({
    userId: demoUser._id,
    make: 'Tesla',
    model: 'Model 3 Long Range',
    year: 2023,
    fuelType: 'EV',
    energyEfficiency: 16.5,
    batteryCapacity: 75.0,
    defaultVehicle: true
  });

  const priusHEV = await Vehicle.create({
    userId: demoUser._id,
    make: 'Toyota',
    model: 'Prius Hybrid',
    year: 2022,
    fuelType: 'HEV',
    fuelEfficiency: 4.5,
    defaultVehicle: false
  });

  const civicICE = await Vehicle.create({
    userId: demoUser._id,
    make: 'Honda',
    model: 'Civic EX',
    year: 2021,
    fuelType: 'ICE',
    fuelEfficiency: 7.2,
    defaultVehicle: false
  });

  // 4. Create Realistic Trips spanning past 30 days
  console.log('[Seed] Generating realistic demo trips...');

  const now = new Date();
  const sampleTrips = [
    {
      vehicleId: teslaEV._id,
      daysAgo: 25,
      startLocation: 'Downtown Office',
      endLocation: 'Home',
      distanceKm: 18.5,
      durationMin: 28,
      avgSpeedKmh: 40,
      maxSpeedKmh: 65,
      idleTimeMin: 2,
      hardAccelerationCount: 0,
      hardBrakingCount: 0,
      energyConsumedKwh: 3.0
    },
    {
      vehicleId: teslaEV._id,
      daysAgo: 21,
      startLocation: 'Home',
      endLocation: 'Grocery Store',
      distanceKm: 6.2,
      durationMin: 14,
      avgSpeedKmh: 28,
      maxSpeedKmh: 50,
      idleTimeMin: 1,
      hardAccelerationCount: 1,
      hardBrakingCount: 0,
      energyConsumedKwh: 1.1
    },
    {
      vehicleId: priusHEV._id,
      daysAgo: 18,
      startLocation: 'Suburban Mall',
      endLocation: 'Home',
      distanceKm: 32.0,
      durationMin: 42,
      avgSpeedKmh: 46,
      maxSpeedKmh: 90,
      idleTimeMin: 5,
      hardAccelerationCount: 4,
      hardBrakingCount: 3,
      fuelConsumedL: 1.8
    },
    {
      vehicleId: civicICE._id,
      daysAgo: 14,
      startLocation: 'City Center',
      endLocation: 'Airport',
      distanceKm: 45.0,
      durationMin: 48,
      avgSpeedKmh: 56,
      maxSpeedKmh: 110,
      idleTimeMin: 3,
      hardAccelerationCount: 1,
      hardBrakingCount: 1,
      fuelConsumedL: 3.2
    },
    {
      vehicleId: teslaEV._id,
      daysAgo: 10,
      startLocation: 'Home',
      endLocation: 'National Park',
      distanceKm: 78.4,
      durationMin: 75,
      avgSpeedKmh: 62,
      maxSpeedKmh: 105,
      idleTimeMin: 0,
      hardAccelerationCount: 0,
      hardBrakingCount: 0,
      energyConsumedKwh: 12.5
    },
    {
      vehicleId: teslaEV._id,
      daysAgo: 5,
      startLocation: 'National Park',
      endLocation: 'Home',
      distanceKm: 78.4,
      durationMin: 80,
      avgSpeedKmh: 59,
      maxSpeedKmh: 100,
      idleTimeMin: 1,
      hardAccelerationCount: 0,
      hardBrakingCount: 1,
      energyConsumedKwh: 12.8
    },
    {
      vehicleId: priusHEV._id,
      daysAgo: 2,
      startLocation: 'Home',
      endLocation: 'Downtown Office',
      distanceKm: 18.2,
      durationMin: 35,
      avgSpeedKmh: 31,
      maxSpeedKmh: 60,
      idleTimeMin: 8,
      hardAccelerationCount: 2,
      hardBrakingCount: 2,
      fuelConsumedL: 0.95
    },
    {
      vehicleId: teslaEV._id,
      daysAgo: 0,
      startLocation: 'Downtown Office',
      endLocation: 'Home',
      distanceKm: 18.5,
      durationMin: 26,
      avgSpeedKmh: 42,
      maxSpeedKmh: 68,
      idleTimeMin: 1,
      hardAccelerationCount: 0,
      hardBrakingCount: 0,
      energyConsumedKwh: 2.9
    }
  ];

  for (const st of sampleTrips) {
    const tripDate = new Date(now);
    tripDate.setDate(now.getDate() - st.daysAgo);

    await tripService.createTrip(demoUser._id, {
      ...st,
      tripDate
    });
  }

  // Create trips for secondary users to populate leaderboard
  for (const su of secondaryUsers) {
    const secVehicle = await Vehicle.create({
      userId: su._id,
      make: 'Toyota',
      model: 'Camry Hybrid',
      year: 2023,
      fuelType: 'HEV',
      fuelEfficiency: 4.8,
      defaultVehicle: true
    });

    await tripService.createTrip(su._id, {
      vehicleId: secVehicle._id,
      tripDate: new Date(),
      startLocation: 'City',
      endLocation: 'Suburbs',
      distanceKm: 25.0,
      durationMin: 30,
      avgSpeedKmh: 50,
      maxSpeedKmh: 80,
      idleTimeMin: 1,
      hardAccelerationCount: 0,
      hardBrakingCount: 0,
      fuelConsumedL: 1.1
    });
  }

  console.log('[Seed] Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('Email: demo@ecodrive.com');
  console.log('Password: Password123!');
  console.log('----------------------------------------------------');

  if (require.main === module) {
    await disconnectDB();
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error(`[Seed Error] ${err.message}`);
    process.exit(1);
  });
}

module.exports = seed;
