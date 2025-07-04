// payments.js (or inside your Express route handler)
const express = require("express");
const Stripe = require("stripe");
const router = express.Router();

// Replace with your real Stripe secret key
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// const stripe = new Stripe("");

router.post("/create-payment-intent", async (req, res) => {
  const { amount, currency } = req.body;
  // Basic validation:
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: "Invalid or missing amount" });
  }
  try {
    // Stripe expects amount in smallest currency unit (cents for USD)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // e.g. $10.00 -> 1000
      currency: currency || "aed",
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
