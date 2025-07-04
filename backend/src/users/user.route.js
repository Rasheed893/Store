const express = require("express");

const router = express.Router();
const { verifyToken } = require("./user.controller");

// verify token for login
router.post("/admin", verifyToken);

module.exports = router;
