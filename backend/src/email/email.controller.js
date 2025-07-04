const mongoose = require("mongoose");
// const { moduel } = require("mongoose");
const { Resend } = require("resend");
const Order = require("../orders/order.model");
const Items = require("../item/item.model");
const express = require("express");
const { generateInvoicePDF } = require("../utils/pdfGenerator");
const logger = require("../utils/logger");

const fs = require("fs");
const path = require("path");
const e = require("express");

const resend = new Resend(process.env.RESEND_API_KEY);

// Send Welcome Email
const sendWelcomeEmail = async (req, res) => {
  try {
    logger.info("Received request body:", req.body);
    // logger.info("✅ Sending welcome email", { email });
    // console.log(`✅ Sending welcome email to ${email}`);

    const { email } = req.body; // Get the email from the request body
    if (!email) {
      logger.error("❌ No email provided in request", { error: error.message });
      return res
        .status(400)
        .json({ success: false, error: "Email is required" });
    }

    // console.log("✅ Sending email to:", email);
    logger.info(`✅ Sending email to: ${email}`);
    logger.info("✅ Sending order to email", { email });

    // Read the email template
    const emailTemplatePath = path.join(__dirname, "./emails/welcome.html");
    let emailHtml = fs.readFileSync(emailTemplatePath, "utf8");

    // Replace {{name}} with the user's email
    emailHtml = emailHtml.replace("{{name}}", email);

    // Send the email
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email, // Send to the user's email
      subject: "Welcome to Our Platform!",
      html: emailHtml,
    });

    res.json({ success: true, status: "Email Sent" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Send Order Confirmation Email
const sendOrderConfirmationEmail = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    const {
      email,
      orderId,
      products,
      subtotal,
      shipping,
      vat,
      totalPrice,
      address,
      customerName,
      phone,
      deliveryNotes,
      paymentId,
      discount,
    } = req.body;

    if (
      !email ||
      !orderId ||
      !products ||
      !totalPrice ||
      !address ||
      !customerName ||
      !phone
    ) {
      console.warn("⚠️ Missing required fields:", {
        email,
        orderId,
        products,
        totalPrice,
        address,
        customerName,
        phone,
      });
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }
    console.log("(controller) discountAmount:", discount);
    // console.log(`✅ (controller) Sending order Number ${orderId} to:`, email);
    // console.log("(controller) address:", address);
    // console.log("(controller) subtotal:", subtotal);
    // console.log("(controller) shipping:", shipping);
    // console.log("(controller) vat:", vat);
    // console.log("(controller) totalPrice:", totalPrice);
    // console.log(paymentId);

    // Get the city from the address object
    const city = address.city;
    // const state = address.state;

    if (!city) {
      console.warn(`⚠️ City not provided in the address.`);
      return res
        .status(400)
        .json({ success: false, error: "City is required in the address" });
    }

    // console.log(`📍 City extracted from address: ${city}`);
    // console.log(`📍 State extracted from address: ${address.state}`);
    // Convert productIds to MongoDB ObjectId
    const productIds = products.map(
      (item) => new mongoose.Types.ObjectId(item.productIds)
    );

    // Fetch product details from database
    const productDetails = await Items.find({ _id: { $in: productIds } });

    // Create product name mapping
    const productNameMap = {};
    productDetails.forEach((product) => {
      productNameMap[product._id.toString()] = product.title;
    });

    logger.info("🔁 Product Name Map:", productNameMap);

    logger.info("✅ Retrieved Products:", productDetails);

    // Map product names into the products array
    const enrichedProducts = products.map((item) => ({
      ...item,
      productName:
        productNameMap[item.productIds.toString()] || "Unknown Product",
    }));
    // Generate PDF invoice and get the public URL
    const invoiceUrl = await generateInvoicePDF(
      orderId,
      enrichedProducts,
      subtotal,
      vat,
      shipping,
      totalPrice,
      city,
      customerName,
      email,
      phone,
      address,
      deliveryNotes,
      paymentId,
      discount
    );
    // console.log("🌐 Public URL for invoice:", JSON.stringify(address, null, 2)); // Read the email template
    const emailTemplatePath = path.join(
      __dirname,
      "./emails/confirmOrder.html"
    );
    let emailHtml = fs.readFileSync(emailTemplatePath, "utf8");

    // let discountBlock = "";
    // if (discount > 0) {
    //   discountBlock = `<div>Discount: AED ${discount.toFixed(2)}</div>`;
    // }

    // Generate the items HTML dynamically
    const itemsHtml = products
      .map((item) => {
        const productName =
          productNameMap[item.productIds.toString()] || "Unknown Item";
        const price = item.price.toFixed(2);

        return `
          <div class="row">
            <div class="column">${productName} × ${item.quantity}</div>
            <div class="column text-right">AED ${price}</div>
          </div>
        `;
      })
      .join("");

    // Replace variables in the email template
    emailHtml = emailHtml.replace("{{products}}", itemsHtml);
    emailHtml = emailHtml.replace("{{orderId}}", orderId);
    emailHtml = emailHtml.replace("{{subtotal}}", subtotal);
    emailHtml = emailHtml.replace("{{discount}}", discount);
    emailHtml = emailHtml.replace("{{totalPrice}}", totalPrice.toFixed(2));
    emailHtml = emailHtml.replace("{{shipping}}", shipping.toFixed(2));
    emailHtml = emailHtml.replace("{{city}}", city);
    emailHtml = emailHtml.replace("{{vat}}", vat.toFixed(2));
    emailHtml = emailHtml.replace("{{total}}", totalPrice.toFixed(2));
    emailHtml = emailHtml.replace("{{invoiceUrl}}", invoiceUrl);
    emailHtml = emailHtml.replace("{{paymentId}}", paymentId);

    const adminEmail = process.env.ADMIN_EMAIL;
    // Send the email
    await Promise.all([
      resend.emails.send({
        from: "onboarding@resend.dev",
        to: email, // Send to the customer's email
        subject: `Order Confirmation - Order #${orderId}`,
        html: emailHtml,
      }),
      resend.emails.send({
        from: "onboarding@resend.dev",
        to: adminEmail, // Send to the admin's email
        subject: `New Order Placed - Order #${orderId}`,
        html: emailHtml,
      }),
    ]);
    return res.json({ success: true, status: "Email Sent" });
  } catch (error) {
    logger.error("Error sending email:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Contact Us Form
const sendContactFormEmail = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    const emailHtml = `
      <h1>New Contact Form Submission</h1>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${message}</p>
    `;

    await resend.emails.send({
      from: "onboarding@resend.dev", // domain email
      to: process.env.ADMIN_EMAIL, // Your admin email
      subject: "New Contact Form Submission",
      html: emailHtml,
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending contact form email:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
};

module.exports = {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendContactFormEmail,
};
