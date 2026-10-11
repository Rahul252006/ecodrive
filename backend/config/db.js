const mongoose = require('mongoose');
const env = require('./environment');

let memoryServer = null;

const connectDB = async () => {
  const primaryUri = (env.mongoUri && !env.mongoUri.includes('<db_username>')) 
    ? env.mongoUri 
    : 'mongodb://127.0.0.1:27017/ecodrive';

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Primary MongoDB connection failed (${err.message}). Trying local fallback...`);
    try {
      const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/ecodrive', {
        serverSelectionTimeoutMS: 2000
      });
      console.log(`[Database] Connected to local MongoDB on port 27017`);
      return localConn;
    } catch (localErr) {
      console.warn(`[Database] Local MongoDB unavailable (${localErr.message}). Attempting Mongo Memory Server fallback...`);
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
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
