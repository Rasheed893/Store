const Comment = require("./comment.model");
const { moduel } = require("mongoose");
const bucket = require("../firebase/config");

// Create a comment
const postComment = async (req, res) => {
  try {
    const { productId, userId, comment, customerName, email } = req.body;
    const newComment = new Comment({
      productId,
      userId,
      comment,
      customerName,
      email,
    });
    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

// Get all comments for a product
const getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find({ productId: req.params.productId })
      .sort({ createdAt: -1 })
      .populate("userId", "username"); // Optional if users exist

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

module.exports = { postComment, getAllComments };
