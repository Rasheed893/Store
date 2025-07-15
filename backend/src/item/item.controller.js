const Item = require("./item.model");
// const bucket = require("../firebase/config");
const { moduel } = require("mongoose");
// const { trace } = require("./item.route");

// Post an Item
const postItem = async (req, res) => {
  try {
    const newItem = await Item({ ...req.body });
    await newItem.save();
    res
      .status(200)
      .send({ message: "Item has been posted successfully", item: newItem });
  } catch (error) {
    console.log("error creating an item", error);
    res.status(500).send({ message: "Posting an Item has been faild", error });
  }
};

// Get all Item
const getAllItem = async (req, res) => {
  try {
    const allItems = await Item.find().sort({ createdAt: -1 });
    res
      .status(200)
      .send({ message: "Items has been fetched successfully", item: allItems });
  } catch (error) {
    console.log("error fetching items", error);
    res.status(500).send({ message: "Can't getch all books", error });
  }
};

// Delete all
const deleteAll = async (req, res) => {
  try {
    const deleteItems = await Item.deleteMany({});
    res
      .status(200)
      .json({ message: "All items deleted successfully", items: deleteItems });
  } catch (error) {
    console.log("error items not deleted", error);
    res.status(500).send({ message: "Pcan't delete items", error });
  }
};

// Fetch One Item
const getSingleItem = async (req, res) => {
  try {
    const { id } = req.params;
    const getItem = await Item.findById(id);
    if (!getItem) {
      return res.status(404).send({ message: "Item not found" });
    }
    res
      .status(200)
      .send({ message: "Item has been fetched successfully", item: getItem });
  } catch (error) {
    console.log("error fetching item", error);
    res.status(500).send({ message: "error fetching", error });
  }
};

// Ubdate Item Data
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = await Item.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updateData) {
      res.status(404).send({ message: "Item not found" });
    }
    res
      .status(200)
      .send({ message: "Item Updated sucessfully", data: updateData });
  } catch (error) {
    console.log("coudln't update item", error);
    res.status(500).send({ message: "error updating data", error });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteOneItem = await Item.findByIdAndDelete(id);
    if (!deleteOneItem) {
      res.status(404).send({ message: "Couldn't delete Item" });
    }

    res.status(200).send({
      message: "Item has been deleted successfully",
      item: deleteOneItem,
    });
  } catch (error) {
    console.log("error deleting item", error);
    res.status(500).send({ message: "Faild to Delete", error });
  }
};

const updateStock = async (req, res) => {
  try {
    console.log("Received updateStock payload:", req.body);
    const items = req.body; // Array of { id, stockQuantity }

    if (!Array.isArray(items) || items.length === 0) {
      console.log("Invalid payload format:", items);
      return res
        .status(400)
        .json({ error: "Request body must be a non-empty array" });
    }

    for (const item of items) {
      if (!item.id || item.stockQuantity === undefined) {
        console.log("Missing id or stockQuantity in item:", item);
        return res
          .status(400)
          .json({ error: "Each item must have id and stockQuantity" });
      }

      console.log(
        `Updating stock for product ${item.id} with stockQuantity ${item.stockQuantity}`
      );
      const updatedProduct = await Item.findByIdAndUpdate(
        item.id,
        { $inc: { stockQuantity: -item.stockQuantity } }, // Fix: Use stockQuantity
        { new: true }
      );

      if (!updatedProduct) {
        console.log("Product not found for ID:", item.id);
        return res
          .status(404)
          .json({ error: `Product not found for ID ${item.id}` });
      }
    }

    res.status(200).json({ message: "Stock updated successfully" });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const searchItem = async (req, res) => {
  try {
    const { title } = req.query;
    const searchResult = await Item.find({
      title: { $regex: title, $options: "i" },
    });
    if (searchResult.length === 0) {
      return res.status(404).json({ message: "No items found" });
    }
    res.status(200).json({ message: "Items found", items: searchResult });
  } catch (error) {
    console.error("Error searching items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addTating = async (req, res) => {
  const { rating, userId } = req.body;
  const { id } = req.params;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

  try {
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const hasRated = item.ratings.find((r) => r.userId === userId);
    if (hasRated) {
      return res
        .status(400)
        .json({ message: "You have already rated this item." });
    }

    item.ratings.push({ userId, stars: rating });
    item.rating.count += 1;
    item.rating.sum += rating;
    item.rating.average = item.rating.sum / item.rating.count;

    await item.save();

    res.status(200).json({ message: "Rating submitted", rating: item.rating });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to submit rating", error: err.message });
  }
};

// Get recommended items
const getRecommendedItems = async (req, res) => {
  try {
    const email = req.params.email;

    // Step 1: Find customer by email
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Step 2: Get all orders of this customer
    const orders = await Order.find({ customer: customer._id });

    // Step 3: Collect all purchased productIds
    const productIdSet = new Set();
    orders.forEach((order) => {
      order.products.forEach((p) => {
        productIdSet.add(p.productIds.toString());
      });
    });

    // Step 4: Get all item categories for those products
    const purchasedItems = await Item.find({
      _id: { $in: Array.from(productIdSet) },
    });
    const purchasedCategories = [
      ...new Set(purchasedItems.map((item) => item.category)),
    ];

    // Step 5: Find other items in same categories (exclude already ordered)
    const recommendedItems = await Item.find({
      category: { $in: purchasedCategories },
      _id: { $nin: Array.from(productIdSet) },
    }).limit(20);

    res.status(200).json({ recommended: recommendedItems });
  } catch (error) {
    console.error("Error fetching recommended items:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
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
};
