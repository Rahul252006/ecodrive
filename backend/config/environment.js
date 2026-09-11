require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecodrive',
  jwtSecret: process.env.JWT_SECRET || 'ecodrive_fallback_secret_key_2026',
  clientUrl: process.env.CLIENT_URL || '*',
  nodeEnv: process.env.NODE_ENV || 'development'
};
