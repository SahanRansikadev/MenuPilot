const app = require("./index");

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`MenuPilot API listening on port ${port}`);
});
