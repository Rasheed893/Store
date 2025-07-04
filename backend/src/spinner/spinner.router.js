const express = require("express");
const router = express.Router();
const upload = require("../config/multer.config");
const verifyAdminToken = require("../middleware/verifyAdmenToken");

const {
  getAllSlides,
  getCarousel,
  addSlide,
  updateSlide,
  deleteSlide,
} = require("./spinner.controller");

// 🚨 Debug Middleware - Add this right here!
// router.use((req, res, next) => {
//   console.log("\n=== NEW REQUEST ===");
//   console.log("Method:", req.method);
//   console.log("URL:", req.originalUrl);
//   console.log("Headers:", {
//     "content-type": req.get("content-type"),
//     authorization: req.get("authorization") ? "***exists***" : "missing",
//   });
//   next();
// });

// Get all Carousels
router.get("/all", getAllSlides);
// Get Slide by name
router.get("/:name", getCarousel);

// Post Slide
router.post("/:name/slides", verifyAdminToken, upload, addSlide);

// Update Slide
router.patch("/:name/slides/:slideId", verifyAdminToken, upload, updateSlide);

// Delete Slide
router.delete("/:name/slides/:slideId", verifyAdminToken, deleteSlide);

module.exports = router;
