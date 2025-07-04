const express = require("express");
const { moduel } = require("mongoose");
const item = require("./promoCode.model");
const {
  createPromoCode,
  validatePromoCode,
  getAllAvailablePromos,
} = require("./promoCode.controller");
const router = express.Router();

router.post("/create", createPromoCode);
router.post("/validate", validatePromoCode);
router.get("/available", getAllAvailablePromos);

module.exports = router;
