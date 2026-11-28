const { createHash } = require("node:crypto");

function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

module.exports = hashSessionToken;
