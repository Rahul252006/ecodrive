const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/environment');
const { connectDB } = require('./config/db');
const errorMiddleware = require('./middleware/error.middleware');
const { apiRateLimiter } = require('./middleware/rateLimit.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const tripRoutes = require('./routes/trip.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const challengeRoutes = require('./routes/challenge.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();

// Dynamic CORS support for Vercel, localhost and custom domains
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, server-to-server, Postman)
    if (!origin) return callback(null, true);

    const allowedDomains = [
      env.clientUrl,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5500',
      'http://127.0.0.1:5500'
    ];

    if (
      env.clientUrl === '*' ||
      allowedDomains.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for API consumer flexibility
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to API routes
app.use('/api', apiRateLimiter);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'UP',
    environment: env.nodeEnv,
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/reports', reportRoutes);

// Serve static frontend files if deployed as fullstack bundle
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found.' }
      });
    }
  });
});

// Global Error Handler
app.use(errorMiddleware);

// Start Server if called directly
if (require.main === module) {
  connectDB().then(() => {
    app.listen(env.port, () => {
      console.log(`[Server] EcoDrive Express API listening on port ${env.port}`);
    });
  }).catch(err => {
    console.error(`[Server Fatal] Failed to start database/server: ${err.message}`);
    process.exit(1);
  });
}

module.exports = app;
