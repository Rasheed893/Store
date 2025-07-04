// models/customer.model.js
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Optional: Enforce unique emails
    },
    phone: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
