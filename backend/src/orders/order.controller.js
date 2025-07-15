const Order = require("./order.model");
const { moduel } = require("mongoose");
const bucket = require("../firebase/config");
const Customer = require("../customer/customer.model");
const PromoCode = require("../promoCode/promoCode.model");

const generateOrderNumber = () => {
  const now = new Date();
  return `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// const creatAnOrder = async (req, res) => {
//   try {
//     const newOrder = await Order({
//       ...req.body,
//       notifications: [
//         {
//           type: "New Order Received",
//         },
//       ],
//     });
//     const saveOrder = await newOrder.save();
//     res.status(200).json({
//       saveOrder,
//       message: "Order created successfully",
//       orderId: saveOrder.id,
//     });
//     console.log(`Order created successfully with ID: ${saveOrder.id}`);
//   } catch (error) {
//     console.log("Error Creating Order.", error);
//     res.status(500).json({ message: "Failed Creating Order", error });
//   }
// };

const creatAnOrder = async (req, res) => {
  try {
    const {
      customerName,
      email,
      phone,
      address,
      products,
      totalPrice,
      deliveryNotes,
      paymentId,
      subtotal,
      shipping,
      vat,
      promoCode,
      discount,
    } = req.body;

    if (!email || !customerName || !phone) {
      return res.status(400).json({ message: "Missing customer details" });
    }

    // 1. Find or create the customer
    let customer = await Customer.findOne({ email });

    if (!customer) {
      customer = await Customer.create({
        customerName,
        email,
        phone,
      });
    }

    // 2. Create the order
    const newOrder = new Order({
      customer: customer._id,
      address,
      phone,
      products,
      subtotal,
      shipping,
      vat,
      totalPrice,
      deliveryNotes,
      paymentId,
      promoCode,
      discount,
      notifications: [
        {
          type: "New Order Received",
        },
      ],
    });

    const saveOrder = await newOrder.save();

    // ✅ 3. Update promoCode usage
    if (promoCode) {
      await PromoCode.updateOne(
        { code: promoCode },
        { $addToSet: { usedBy: email.toLowerCase() } }
      );
      console.log(`📦 Promo code ${promoCode} marked as used by ${email}`);
    }

    res.status(200).json({
      saveOrder,
      message: "Order created successfully",
      orderId: saveOrder.id,
    });

    console.log(`✅ Order created successfully with ID: ${saveOrder.id}`);
  } catch (error) {
    console.error("❌ Error Creating Order:", error);
    res.status(500).json({ message: "Failed Creating Order", error });
  }
};

// const creatAnOrder = async (req, res) => {
//   try {
//     const {
//       customerName,
//       email,
//       phone,
//       address,
//       products,
//       totalPrice,
//       deliveryNotes,
//       paymentId, // Added new field
//       subtotal,
//       shipping,
//       vat,
//     } = req.body;

//     if (!email || !customerName || !phone) {
//       return res.status(400).json({ message: "Missing customer details" });
//     }

//     // 1. Find or create the customer
//     let customer = await Customer.findOne({ email });

//     if (!customer) {
//       customer = await Customer.create({
//         customerName,
//         email,
//         phone,
//       });
//     }

//     // 2. Create the order with reference to the customer
//     const newOrder = new Order({
//       customer: customer._id,
//       address,
//       phone,
//       products,
//       subtotal: subtotal,
//       shipping: shipping,
//       vat: vat,
//       totalPrice,
//       deliveryNotes,
//       paymentId, // Added new field
//       notifications: [
//         {
//           type: "New Order Received",
//         },
//       ],
//     });
//     console.log("pricing", subtotal, shipping, vat, totalPrice);

//     // 3. Save order
//     const saveOrder = await newOrder.save();

//     res.status(200).json({
//       saveOrder,
//       message: "Order created successfully",
//       orderId: saveOrder.id,
//     });

//     console.log(`✅ Order created successfully with ID: ${saveOrder.id}`);
//   } catch (error) {
//     console.error("❌ Error Creating Order:", error);
//     res.status(500).json({ message: "Failed Creating Order", error });
//   }
// };

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtering
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.email) {
      filter.email = { $regex: req.query.email, $options: "i" }; // case-insensitive partial match
    }

    // Count total filtered orders
    const totalOrders = await Order.countDocuments(filter);

    // Query with filter, pagination, and product title population
    const orders = await Order.find(filter)
      .populate("products.productIds", "title") // Populate product title
      .populate("customer", "customerName email phone") // Populate customer fields
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      message: "Orders fetched successfully",
      page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      item: orders,
    });
  } catch (error) {
    console.log("Error fetching orders", error);
    res.status(500).send({ message: "Failed to fetch all orders", error });
  }
};

// Update Order Status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate if status is allowed
    const allowedStatuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).send({ message: "Invalid status value" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status,
        $push: {
          notifications: {
            type: `Order marked as ${status}`,
          },
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).send({ message: "Order not found" });
    }

    res.status(200).send({
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Couldn't update order status", error);
    res.status(500).send({ message: "Error updating order status", error });
  }
};

// Delete Order
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    if (!deletedOrder) {
      return res.status(404).send({ message: "Order not found" });
    }
    res.status(200).send({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Couldn't delete order", error);
    res.status(500).send({ message: "Error deleting order", error });
  }
};

// Get Order by Email
// const getOrderByEmail = async (req, res) => {
//   try {
//     const { email } = req.params;
//     const orders = await Order.find({ email }).sort({ createdAt: -1 });
//     if (!orders) {
//       return res.status(404).json({ message: "Order not found" });
//     }
//     res.status(200).json(orders);
//   } catch (error) {
//     console.log("Error sending order to email.", error);
//     res.status(500).json({ message: "Failed sending order to email.", error });
//   }
// };
const getOrderByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Find the customer by email
    const customer = await Customer.findOne({ email: customerId });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const orders = await Order.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .populate("customer")
      .populate("products.productIds", "title coverImage");

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.log("Error fetching orders by customer ID:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

//Get Invoice URL
const getInvoiceUrl = async (req, res) => {
  const { orderId } = req.params;

  try {
    const file = bucket.file(`invoices/invoice-${orderId}.pdf`);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ url });
  } catch (error) {
    console.error("Error generating invoice URL:", error);
    res.status(500).json({ message: "Failed to generate invoice URL" });
  }
};

module.exports = {
  creatAnOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderByCustomerId,
  deleteOrder,
  getInvoiceUrl,
};
