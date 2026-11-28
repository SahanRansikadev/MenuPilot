function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: "You do not have permission to access this resource." });
    }

    return next();
  };
}

module.exports = requireRole;
