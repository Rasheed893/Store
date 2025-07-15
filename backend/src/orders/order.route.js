const express = require("express");
const router = express.Router();

const {
  creatAnOrder,
  updateOrderStatus,
  getAllOrders,
  getOrderByCustomerId,
  deleteOrder,
  getInvoiceUrl,
  getRecommendedItems,
} = require("./order.controller");

// Add new order
router.post("/", creatAnOrder);

// Get all orders
router.get("/get-orders", getAllOrders);

// Update Order Status
router.put("/update/order/status/:orderId", updateOrderStatus);

// Delete Order
router.delete("/delete/order/:orderId", deleteOrder);

// Get Order by cuustomer email
// router.get("/email/:email", getOrderByEmail);
router.get("/customer/:customerId", getOrderByCustomerId);

// Download Invoice URL
router.get("/invoice-url/:orderId", getInvoiceUrl);

// Get recommended items
router.get("/recommended/:email", getRecommendedItems);

module.exports = router;
