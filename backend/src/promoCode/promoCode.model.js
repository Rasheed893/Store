const mongoose = require("mongoose");
const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountPercentage: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
  freeShipping: { type: Boolean, default: false },
  promoDescription: { type: String, required: true },
  usedBy: [{ type: String }], // store email or UID
});

module.exports = mongoose.model("PromoCode", promoCodeSchema);
