const express = require("express");
const app = require("./application");
const connectToDatabase = require("./config/database");

const serverlessApp = express();

serverlessApp.use(async (req, res, next) => {
  if (
    req.method === "OPTIONS" ||
    (req.method === "GET" && (req.path === "/" || req.path === "/api/health"))
  ) {
    return next();
  }

  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error(
      "Unable to serve API request. Check MONGODB_URI and Atlas Network Access.",
      { error: error.name },
    );
    res.status(500).json({ error: "Unable to connect to the database." });
  }
});

serverlessApp.use(app);

module.exports = serverlessApp;
