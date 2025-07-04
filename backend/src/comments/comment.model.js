const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Items", // Match your actual model name
      required: true,
    },
    userId: {
      type: String,
      required: false,
      // type: mongoose.Schema.Types.ObjectId,
      // ref: "User",
    },
    customerName: {
      type: String,
      default: "Anonymous",
    },
    email: {
      type: String,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
