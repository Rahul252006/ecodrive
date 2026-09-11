module.exports = {
  ECO_SCORE: {
    WEIGHTS: {
      ACCELERATION: 0.25,
      BRAKING: 0.20,
      IDLE: 0.15,
      SPEED_CONSISTENCY: 0.15,
      EFFICIENCY: 0.15,
      ROUTE_EFFICIENCY: 0.10
    },
    CATEGORIES: [
      { min: 90, max: 100, label: 'Excellent', color: '#10B981' },
      { min: 75, max: 89, label: 'Good', color: '#3B82F6' },
      { min: 60, max: 74, label: 'Fair', color: '#F59E0B' },
      { min: 0, max: 59, label: 'Needs Improvement', color: '#EF4444' }
    ]
  },

  EMISSIONS_FACTORS: {
    ICE_GASOLINE_KG_PER_L: 2.31,
    EV_GRID_KG_PER_KWH: 0.40
  },

  DEFAULT_PRICES: {
    FUEL_USD_PER_L: 1.50,
    ELECTRICITY_USD_PER_KWH: 0.15
  },

  VEHICLE_TYPES: {
    ICE: 'ICE',
    HEV: 'HEV',
    PHEV: 'PHEV',
    EV: 'EV'
  },

  XP_EVENTS: {
    TRIP_COMPLETED: 50,
    EXCELLENT_ECO_SCORE: 30,
    CHALLENGE_COMPLETED: 100,
    STREAK_BONUS: 20
  },

  LEVEL_XP_STEP: 200
};
