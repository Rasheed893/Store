const express = require("express");
const { moduel } = require("mongoose");
const {
  addShippingRate,
  getShippingRate,
  editShippingRate,
  deleteShippingRate,
} = require("./shippingRate.controller");
const verifyAdminToken = require("../middleware/verifyAdmenToken");
const router = express.Router();

router.post("/add", verifyAdminToken, addShippingRate);

router.get("/get", getShippingRate);

router.put("/edit/:id", verifyAdminToken, editShippingRate);

router.delete("/delete/:id", verifyAdminToken, deleteShippingRate);

module.exports = router;
