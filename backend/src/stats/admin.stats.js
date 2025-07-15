const mongoose = require("mongoose");
const express = require("express");
const Order = require("../orders/order.model");
const Items = require("../item/item.model");
const router = express.Router();

// Function to calc admin stats
router.get("/", async (req, res) => {
  try {
    // 1. Total number of orders
    const totalOrders = await Order.countDocuments();

    // 2. Total sales (sum of all totalPrice from orders)
    const totalSales = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
        },
      },
    ]);
    // 3. Trending items statistics
    const trendingItemCount = await Items.aggregate([
      {
        $match: { trending: true }, // Match only trending items
      },
      {
        $count: "trendingItemCount", // return the count of trending items
      },
    ]);
    // if you want  to conunt as a number, you can extract it like this
    const trendingItems =
      trendingItemCount.length > 0 ? trendingItemCount[0].trendingItemCount : 0;

    // 4. Total number of items
    const totalItems = await Items.countDocuments();

    // 5. Monthly sales (group by month and sum total sales for each month)
    const monthlySales = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, // Group by year and month
          totalSales: { $sum: "$totalPrice" }, // sum total price for each month
          totalOrders: { $sum: 1 }, // count total orders for each month
        },
      },
      { $sort: { _id: 1 } }, // sort by month ascending order
    ]);

    // // 6. Top Customers
    // const topCustomers = await Order.aggregate([
    //   {
    //     $group: {
    //       _id: { name: "$customer", email: "$email" },
    //       totalSpent: { $sum: "$totalPrice" },
    //       orderCount: { $sum: 1 },
    //     },
    //   },
    //   { $sort: { totalSpent: -1 } },
    //   { $limit: 10 },
    // ]);
    const topCustomers = await Order.aggregate([
      {
        $lookup: {
          from: "customers", // This must match the actual MongoDB collection name
          localField: "customer",
          foreignField: "_id",
          as: "customerInfo",
        },
      },
      { $unwind: "$customerInfo" },
      {
        $group: {
          _id: {
            name: "$customerInfo.customerName",
            email: "$customerInfo.email",
          },
          totalSpent: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);

    // Most purchased
    const mostPurchasedItems = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productIds",
          totalSold: { $sum: "$products.quantity" },
        },
      },
      {
        $lookup: {
          from: "items",
          localField: "_id",
          foreignField: "_id",
          as: "itemInfo",
        },
      },
      { $unwind: "$itemInfo" },
      {
        $project: {
          title: "$itemInfo.title",
          stockQuantity: "$itemInfo.stockQuantity",
          totalSold: 1,
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    // Least purchased
    const leastPurchasedItems = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productIds",
          totalSold: { $sum: "$products.quantity" },
        },
      },
      {
        $lookup: {
          from: "items",
          localField: "_id",
          foreignField: "_id",
          as: "itemInfo",
        },
      },
      { $unwind: "$itemInfo" },
      {
        $project: {
          title: "$itemInfo.title",
          stockQuantity: "$itemInfo.stockQuantity",
          totalSold: 1,
        },
      },
      { $sort: { totalSold: 1 } },
      { $limit: 10 },
    ]);

    // 7. Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // 8. Low stock items (less than 5 in stock)
    const lowStockItems = await Items.find({ stockQuantity: { $lt: 5 } })
      .select("title stockQuantity")
      .limit(10);

    // Resull summary
    res.status(200).json({
      totalOrders,
      totalSales: totalSales[0]?.totalSales || 0,
      trendingItems,
      totalItems,
      monthlySales,
      topCustomers,
      mostPurchasedItems,
      leastPurchasedItems,
      ordersByStatus,
      lowStockItems,
    });
  } catch (error) {
    console.log("Error fetching admin stats.", error);
    res.status(500).json({ message: " Failed to fetch admin stats" });
  }
});

// GET /api/top-sellers
router.get("/top-sellers", async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const topSellers = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $unwind: "$products" },
      {
        $match: {
          "products.productIds": { $exists: true, $ne: null }, // ✅ filter out undefined/null
        },
      },
      {
        $group: {
          _id: { $toObjectId: "$products.productIds" }, // ✅ safe now
          totalQty: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 12 },
      {
        $lookup: {
          from: "items",
          localField: "_id",
          foreignField: "_id",
          as: "item",
        },
      },
      { $unwind: "$item" },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$item",
              {
                purchasesThisMonth: "$totalQty",
                id: { $toString: "$_id" }, // ✅ inject `id` field for frontend
              },
            ],
          },
        },
      },
    ]);

    res.status(200).json(topSellers);
  } catch (error) {
    console.error("Failed to fetch top sellers", error);
    res.status(500).json({ message: "Server error fetching top sellers" });
  }
});

module.exports = router;
