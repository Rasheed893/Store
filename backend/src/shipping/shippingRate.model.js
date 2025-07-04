const mongoose = require("mongoose");

const shippingRateSchema = new mongoose.Schema({
  city: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
});

module.exports = mongoose.model("ShippingRate", shippingRateSchema);
