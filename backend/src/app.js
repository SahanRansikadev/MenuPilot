const express = require("express");
const app = require("./application");
const connectToDatabase = require("./config/database");

const serverlessApp = express();

serverlessApp.use(async (_req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error(
      "Unable to serve API request. Check MONGODB_URI and Atlas Network Access.",
      { error: error.name },
    );
    res.status(503).json({ error: "Service temporarily unavailable." });
  }
});

serverlessApp.use(app);

module.exports = serverlessApp;
