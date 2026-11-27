const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");
const connectToDatabase = require("../src/config/database");

test("reuses the in-flight MongoDB connection and selects the configured database", async (t) => {
  const originalConnect = mongoose.connect;
  const originalReadyState = mongoose.connection.readyState;
  const originalUri = process.env.MONGODB_URI;
  const originalDatabaseName = process.env.MONGODB_DB_NAME;
  const calls = [];
  let finishConnection;

  process.env.MONGODB_URI = "mongodb+srv://cluster.example.mongodb.net/";
  process.env.MONGODB_DB_NAME = "menupilot-test";
  mongoose.connection.readyState = 0;
  mongoose.connect = (...args) => {
    calls.push(args);
    return new Promise((resolve) => {
      finishConnection = () => {
        mongoose.connection.readyState = 1;
        resolve(mongoose);
      };
    });
  };
  t.after(() => {
    mongoose.connect = originalConnect;
    mongoose.connection.readyState = originalReadyState;
    if (originalUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalUri;
    }
    if (originalDatabaseName === undefined) {
      delete process.env.MONGODB_DB_NAME;
    } else {
      process.env.MONGODB_DB_NAME = originalDatabaseName;
    }
  });

  const firstConnection = connectToDatabase();
  const secondConnection = connectToDatabase();
  assert.equal(calls.length, 1);
  finishConnection();
  await Promise.all([firstConnection, secondConnection]);
  await connectToDatabase();

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], process.env.MONGODB_URI);
  assert.deepEqual(calls[0][1], {
    dbName: "menupilot-test",
    bufferCommands: false,
    maxPoolSize: 10,
    minPoolSize: 0,
  });
});

test("retries after a failed connection and defaults the database name", async (t) => {
  const originalConnect = mongoose.connect;
  const originalReadyState = mongoose.connection.readyState;
  const originalUri = process.env.MONGODB_URI;
  const originalDatabaseName = process.env.MONGODB_DB_NAME;
  const originalConsoleError = console.error;
  let attempts = 0;

  process.env.MONGODB_URI = "mongodb+srv://cluster.example.mongodb.net/";
  delete process.env.MONGODB_DB_NAME;
  mongoose.connection.readyState = 0;
  mongoose.connect = () => {
    attempts += 1;
    return attempts === 1 ? Promise.reject(new Error("connection failed")) : Promise.resolve(mongoose);
  };
  console.error = () => {};
  t.after(() => {
    mongoose.connect = originalConnect;
    mongoose.connection.readyState = originalReadyState;
    console.error = originalConsoleError;
    if (originalUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalUri;
    }
    if (originalDatabaseName === undefined) {
      delete process.env.MONGODB_DB_NAME;
    } else {
      process.env.MONGODB_DB_NAME = originalDatabaseName;
    }
  });

  await assert.rejects(connectToDatabase(), /connection failed/);
  await connectToDatabase();

  assert.equal(attempts, 2);
});
