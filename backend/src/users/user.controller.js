const { moduel } = require("mongoose");
const User = require("./user.model");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET_KEY;

// Verify Admin Token
const verifyToken = async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await User.findOne({ username });
    if (!admin) {
      return res.status(404).send({ message: "Admin not found" });
    }
    if (admin.password !== password) {
      return res.status(401).send({ message: "Invalid password" });
    }
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    return res.status(200).json({
      message: "Authentication successfull",
      token: token,
      user: {
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    console.log("Failed to login as admin");
    return res.status(401).send({ message: "Failed to login as admin" });
  }
};

module.exports = {
  verifyToken,
};
