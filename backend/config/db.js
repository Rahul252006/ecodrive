const mongoose = require('mongoose');
const env = require('./environment');

let memoryServer = null;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Standard MongoDB connection failed (${err.message}). Attempting Mongo Memory Server fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const uri = memoryServer.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[Database] Connected to in-memory MongoDB at: ${uri}`);
      return conn;
    } catch (memErr) {
      console.error(`[Database Error] Could not connect to MongoDB: ${memErr.message}`);
      throw memErr;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
