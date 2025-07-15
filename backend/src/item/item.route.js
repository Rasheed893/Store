const express = require("express");
const { moduel } = require("mongoose");
const item = require("./item.model");
const {
  postItem,
  getAllItem,
  deleteAll,
  getSingleItem,
  updateItem,
  deleteItem,
  updateStock,
  searchItem,
  addTating,
  getRecommendedItems,
} = require("./item.controller");
const verifyAdminToken = require("../middleware/verifyAdmenToken");
const router = express.Router();

// Post an Item
router.post("/create-book", verifyAdminToken, postItem);

// Search Item
router.get("/search", searchItem);

// Get All Items
router.get("/get-all", getAllItem);

// Delete All Items
router.delete("/delete-all", verifyAdminToken, deleteAll);

// Get Single Item
router.get("/:id", getSingleItem);

// Edit Item
router.put("/edit/:id", verifyAdminToken, updateItem);

// Delete Item
router.delete("/delete-:id", verifyAdminToken, deleteItem);

// Update stock quantity
router.post("/updateStock", updateStock);

// Add rating
router.post("/:id/rate", addTating);

// Get recommended items
router.get("/recommended/:email", getRecommendedItems);

module.exports = router;
