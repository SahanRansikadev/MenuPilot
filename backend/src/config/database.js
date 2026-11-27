const mongoose = require("mongoose");

let connectionPromise;

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI?.trim();
  if (
    !uri ||
    uri === "your_mongodb_atlas_connection_string" ||
    uri.includes("<") ||
    uri.includes(">")
  ) {
    throw new Error("Set MONGODB_URI in backend/.env or the deployment environment.");
  }

  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    throw new Error("MongoDB URI has an invalid format.");
  }

  let uriDatabaseName;
  try {
    uriDatabaseName = new URL(uri).pathname.replace(/^\/+|\/+$/g, "");
  } catch {
    throw new Error("MongoDB URI has an invalid format.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    const databaseName = process.env.MONGODB_DB_NAME?.trim();
    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 0,
    };

    if (databaseName) {
      options.dbName = databaseName;
    } else if (!uriDatabaseName) {
      options.dbName = "menupilot";
    }

    connectionPromise = mongoose
      .connect(uri, options)
      .then((connection) => {
        console.log("Connected to MongoDB.");
        return connection;
      })
      .catch((error) => {
        console.error(
          "MongoDB connection failed. Check MONGODB_URI, Atlas credentials, and Network Access.",
          { error: error.name },
        );
        throw error;
      })
      .finally(() => {
        connectionPromise = undefined;
      });
  }

  return connectionPromise;
}

module.exports = connectToDatabase;