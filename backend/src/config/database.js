const mongoose = require("mongoose");

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri || uri === "your_mongodb_atlas_connection_string") {
    throw new Error("Set MONGODB_URI in backend/.env to your MongoDB Atlas connection string.");
  }

  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    throw new Error("MongoDB URI has an invalid format.");
  }

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || "menupilot",
    bufferCommands: false,
  });

  console.log("Connected to MongoDB.");
}

module.exports = connectToDatabase;