const mongoose = require("mongoose");

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Create backend/.env from backend/.env.example and set the rotated Atlas connection string.",
    );
  }

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || "menupilot",
    bufferCommands: false,
  });

  console.log("Connected to MongoDB.");
}

module.exports = connectToDatabase;
