const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const path = require("path");
const helmet = require("helmet");

const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const port = process.env.PORT || 5000;
const allowedOrigins = process.env.CORS_ORIGIN;
// const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];
// Middleware
app.use(express.json());
app.use(cookieParser()); // Middleware to read HTTP-only cookies
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
console.log(allowedOrigins);
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://js.stripe.com",
        "https://m.stripe.network",
        "https://b.stripecdn.com",
        "https://*.stripe.com",
        "https://apis.google.com",
      ],
      frameSrc: [
        "'self'",
        "https://js.stripe.com",
        "https://hooks.stripe.com",
        "https://m.stripe.network",
        "https://*.stripe.com",
      ],
      connectSrc: [
        "'self'",
        "https://frontend-delta-gules-16.vercel.app",
        "https://store-production-39af.up.railway.app",
        // "http://localhost:5000",
        "https://api.stripe.com",
        "https://m.stripe.com",
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.stripe.com"],
    },
  })
);

// Routes
const itemRoute = require("./src/item/item.route");
const orderRoute = require("./src/orders/order.route");
const userRoute = require("./src/users/user.route");
const adminRoute = require("./src/stats/admin.stats");
const emailRoute = require("./src/email/email.route");
const commentRoute = require("./src/comments/comment.route");
const spinnerRoute = require("./src/spinner/spinner.router");
const paymentsRoute = require("./src/payment/payment.route");
const shippingRate = require("./src/shipping/shippingRate.route");
const promoCode = require("./src/promoCode/promoCode.router");

app.use("/api/items", itemRoute);
app.use("/api/orders", orderRoute);
app.use("/api/auth", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/email", emailRoute);
app.use("/invoices", express.static(path.join(__dirname, "src/invoices")));
app.use("/api/comments", commentRoute);
app.use("/api/spinner", spinnerRoute);
app.use("/api/payments", paymentsRoute);
app.use("/api/shipping-rate", shippingRate);
app.use("/api/promo", promoCode);

// eSd46z75rnuAJKEJ - password

app.get("/", (req, res) => {
  res.send({ message: "Hello from the server!" });
});

async function main() {
  await mongoose.connect(process.env.DB_URL);
}

main()
  .then(() => console.log("Mongodb connect successfully"))
  .catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
