const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET_KEY;

const verifyAdminToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denide, No token provided!" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "invalid credentials" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied: Admins only" });
    }

    req.user = user;
    next();
  });
};

module.exports = verifyAdminToken;
