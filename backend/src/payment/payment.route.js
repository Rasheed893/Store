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

// Server-side code (Node.js)
// router.post("/check-payment-status", async (req, res) => {
//   const { paymentIntentId } = req.body;

//   try {
//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
//     // Handle different status values securely on server
//     switch (paymentIntent.status) {
//       case "succeeded":
//         // Payment complete
//         break;
//       case "requires_action":
//         // Additional authentication needed
//         break;
//       case "requires_payment_method":
//         // Previous attempt failed
//         break;
//     }
//     // Return only necessary information to client
//     res.json({ status: paymentIntent.status });
//   } catch (error) {
//     // Handle errors securely
//     console.error("Error:", error);
//     res.status(500).json({ error: "Payment verification failed" });
//   }
// });

module.exports = router;
