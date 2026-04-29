// config/db.js
const mongoose = require("mongoose");
const dns = require("node:dns/promises");

const connectDB = async () => {
  try {
dns.setServers(["8.8.8.8", "1.1.1.1"]);
    console.log('Connecting to MongoDB...', process.env.MONGO_URI);
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
