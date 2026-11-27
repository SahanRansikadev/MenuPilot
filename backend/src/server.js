const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = require("./app");
const connectToDatabase = require("./config/database");

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`MenuPilot API listening on port ${port}.`);
    });
  } catch (error) {
    console.error("Unable to start the API server:", error.message);
    process.exitCode = 1;
  }
}

startServer();
