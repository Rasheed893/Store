const express = require("express");
const {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendContactFormEmail,
} = require("./email.controller");

const router = express.Router();

router.post("/welcome-email", sendWelcomeEmail);
router.post("/confirm-order", sendOrderConfirmationEmail);
router.post("/contact-form", sendContactFormEmail);

module.exports = router;
