const mongoose = require("mongoose");

const spinnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ["main-banner", "products-carousel", "special-offers"],
    unique: true,
  },
  slides: [
    {
      title: { type: String, required: true },
      subtitle: String,
      buttons: [
        {
          text: { type: String, required: true },
          url: { type: String, required: true },
          // style: { type: String, default: "primary" },
        },
      ],
      image: {
        url: { type: String, required: true },
        firebasePath: { type: String, required: true }, // Store Firebase storage path
      },
      isActive: { type: Boolean, default: true },
      order: { type: Number, default: 0 },
    },
  ],
  settings: {
    autoplay: { type: Boolean, default: true },
    interval: { type: Number, default: 3000 },
  },
});

module.exports = mongoose.model("Spinner", spinnerSchema);
