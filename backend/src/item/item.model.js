const mongoose = require("mongoose");

// Define schema for customer reviews
// const reviewSchema = new mongoose.Schema({
//   userName: { type: String, required: true }, // Name of the customer
//   date: { type: Date, default: Date.now }, // Review date
//   rating: { type: Number, required: true, min: 1, max: 5 }, // Customer rating out of 5
//   comment: { type: String, required: true }, // Review text
// });

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Additional descriptive fields
    additionalDescription: {
      type: String, // Extended product description
      default: "",
    },
    moreDetails: {
      type: String, // More in-depth details about the product
      default: "",
    },
    // Key product features
    features: {
      type: [String], // List of feature highlights
      default: [],
      // e.g. ["Feature 1", "Feature 2", ...]
    },
    // Key product features
    colorOptions: {
      type: [String], // List of feature highlights
      default: [],
      // e.g. ["color 1", "color 2", ...]
    },
    // Technical specifications
    material: { type: String, default: "" }, // Material information
    dimensions: { type: String, default: "" }, // Size dimensions (e.g. "12 x 8 x 3 cm")
    weight: { type: String, default: "" }, // Weight (e.g. "180g")
    colorOptions: { type: [String], default: [] }, // Available color variants
    warranty: { type: String, default: "" }, // Warranty information
    countryOfOrigin: { type: String, default: "" }, // Country where product is made

    category: {
      type: String,
      required: true,
    },
    trending: {
      type: Boolean,
      default: false,
      required: true,
    },
    ratings: [
      {
        userId: String,
        stars: Number,
        date: { type: Date, default: Date.now },
      },
    ],
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
      sum: { type: Number, default: 0 },
    },
    coverImage: {
      type: String,
      // required: true,
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    oldPrice: {
      type: Number,
      required: true,
    },
    newPrice: {
      type: Number,
      required: true,
    },
    stockQuantity: {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          return value >= 0;
        },
        message: "Stock quantity cannot be negative",
      },
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    timeStamps: {
      type: Date,
    },
    // reviews: {
    //   type: [reviewSchema], // Customer reviews list
    //   default: [],
    // },
    // deleted: {
    //   type: Boolean,
    //   default: false,
    // },
  },
  {
    toJSON: {
      virtuals: true, // Enables `id` field to be created from `_id`
      transform: (doc, ret) => {
        ret.id = ret._id; // Map `_id` to `id`
        delete ret._id; // Remove `_id`
        delete ret.__v; // Remove version key (optional)
      },
    },
  }
);

const Items = mongoose.model("Items", itemSchema);

module.exports = Items;
