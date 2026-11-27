const path = require("node:path");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    path: path.resolve(__dirname, "../.env"),
  });
}

const app = require("./application");
const connectToDatabase = require("./config/database");
const port = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`MenuPilot API listening on port ${port}.`);
    });
  } catch (error) {
    console.error("Unable to start the API server. Check MONGODB_URI and Atlas Network Access.", {
      error: error.name,
    });
    process.exitCode = 1;
  }
}

startServer();