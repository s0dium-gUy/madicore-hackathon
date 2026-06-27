const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  try {
    console.log("Connecting to MongoDB at configured MONGO_URI...");
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout fast if URI is unreachable
    });
    console.log(`✔  MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
    return false; // Connected to external DB, no autoseed needed unless empty
  } catch (err) {
    console.warn(`⚠  Failed to connect to configured MongoDB (${err.message}). Falling back to local in-memory database...`);
    try {
      mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`✔  Local In-Memory MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
      return true; // Connected to in-memory, autoseed is required
    } catch (memErr) {
      console.error("✖  Local In-Memory MongoDB startup failed:", memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
