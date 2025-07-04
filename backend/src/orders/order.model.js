const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      // type: String,
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    // email: {
    //   // type: String,
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Customer",
    //   required: true,
    // },
    address: {
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      state: String,
      zipcode: String,
    },
    phone: {
      type: Number,
      required: true,
    },
    products: [
      {
        productIds: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Items", // Make sure this matches your actual model name
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    shipping: {
      type: Number,
      required: true,
    },
    vat: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    paymentId: { type: String },
    notifications: [
      {
        type: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
    promoCode: { type: String, default: null },
    discount: { type: Number, default: 0 },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      virtuals: true, // Enables id field to be created from _id
      transform: (doc, ret) => {
        ret.id = ret._id; // Map _id to id
        delete ret._id; // Remove _id
        delete ret.__v; // Remove version key (optional)
      },
    },
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
