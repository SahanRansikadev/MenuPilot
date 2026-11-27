function parseAuthPayload(value, requireName) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const name = typeof value.name === "string" ? value.name.trim() : undefined;
  const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  const password = typeof value.password === "string" ? value.password : "";

  if (
    (requireName && (!name || name.length > 100)) ||
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length === 0 ||
    (requireName && password.length < 8) ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return null;
  }

  return { name, email, password };
}

module.exports = parseAuthPayload;
