const express = require("express");
const router = express.Router();

const { postComment, getAllComments } = require("./comment.controller");

// Create a comment
router.post("/", postComment);

// Get all comments for a product
router.get("/:productId", getAllComments);

module.exports = router;
