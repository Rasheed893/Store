const bucket = require("../firebase/config");
const Spinner = require("./spinner.model");

const deleteFirebaseFile = async (path) => {
  try {
    const file = bucket.file(path);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log(`Deleted file: ${path}`);
    }
  } catch (error) {
    console.error("Firebase delete error:", error);
    throw error; // Let controller handle
  }
};

// Get All Carousels
const getAllSlides = async (req, res) => {
  try {
    const spinners = await Spinner.find({}).select("name slides settings");

    if (!spinners.length) {
      return res.status(404).json({ message: "No spinners found" });
    }

    res.status(200).json({ success: true, spinners });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get carousel by name
const getCarousel = async (req, res) => {
  try {
    const { name } = req.params;

    const carousel = await Spinner.findOne({
      name,
      "slides.isActive": true,
    }).select("slides settings");

    if (!carousel) {
      return res.status(404).json({
        success: false,
        message: "Carousel not found or has no active slides",
      });
    }

    // Sort slides by their order field
    const sortedSlides = carousel.slides
      .filter((slide) => slide.isActive)
      .sort((a, b) => a.order - b.order);

    res.status(200).json({
      success: true,
      settings: carousel.settings,
      slides: sortedSlides,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const addSlide = async (req, res) => {
  try {
    const { name } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No image uploaded" });

    const filename = `spinners/${name}/${Date.now()}_${file.originalname}`;
    const firebaseFile = bucket.file(filename);

    const blobStream = firebaseFile.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on("error", (err) => {
      console.error("Firebase upload error:", err);
      return res.status(500).json({ error: "File upload failed" });
    });

    blobStream.on("finish", async () => {
      try {
        await firebaseFile.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${firebaseFile.name}`;

        // Parse buttons before creating newSlide
        const buttons = JSON.parse(req.body.buttons);

        const newSlide = {
          title: req.body.title,
          subtitle: req.body.subtitle,
          buttons,
          image: {
            url: publicUrl,
            firebasePath: filename,
          },
        };

        // Update MongoDB using $push
        const updatedCarousel = await Spinner.findOneAndUpdate(
          { name },
          { $push: { slides: newSlide } },
          {
            new: true,
            upsert: true, // Create if doesn't exist
          }
        );

        // console.log("MongoDB Update Result:", updatedCarousel);
        res.status(201).json(updatedCarousel);
      } catch (dbError) {
        console.error("Database operation error:", dbError);
        res.status(500).json({
          error: "Database operation failed",
          details: dbError.message,
        });
      }
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.error("Global error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

const updateSlide = async (req, res) => {
  try {
    const { name, slideId } = req.params;
    const file = req.file;

    // 1. Find the carousel
    const spinner = await Spinner.findOne({ name });
    if (!spinner) return res.status(404).json({ error: "Carousel not found" });

    // 2. Find the specific slide
    const slideIndex = spinner.slides.findIndex(
      (slide) => slide._id.toString() === slideId
    );
    if (slideIndex === -1)
      return res.status(404).json({ error: "Slide not found" });

    // 3. Handle image update
    if (file) {
      // Delete old image from Firebase
      await deleteFirebaseFile(spinner.slides[slideIndex].image.firebasePath);

      // Upload new image
      const filename = `spinners/${name}/${Date.now()}_${file.originalname}`;
      const firebaseFile = bucket.file(filename);
      await firebaseFile.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });

      const [url] = await firebaseFile.getSignedUrl({
        action: "read",
        expires: "03-09-2491",
      });
      // await firebaseFile.makePublic();
      // const url = `https://storage.googleapis.com/${bucket.name}/${firebaseFile.name}`;

      // Update image reference
      spinner.slides[slideIndex].image = {
        url,
        firebasePath: filename,
      };
    }

    // 4. Update other fields
    if (req.body.title) spinner.slides[slideIndex].title = req.body.title;
    if (req.body.subtitle)
      spinner.slides[slideIndex].subtitle = req.body.subtitle;
    if (req.body.buttons)
      spinner.slides[slideIndex].buttons = JSON.parse(req.body.buttons);

    // 5. Mark the slides array as modified
    spinner.markModified("slides");

    // 6. Save the document
    const updated = await spinner.save();

    res.json(updated);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      error: "Failed to update slide",
      details: error.message,
    });
  }
};

// const updateSlide = async (req, res) => {
//   try {
//     const { name, slideId } = req.params;
//     const file = req.file;
//     let imageUpdate = {};

//     // Find existing slide first
//     const spinner = await Spinner.findOne({ name });
//     const slide = spinner.slides.id(slideId);

//     if (!slide) return res.status(404).json({ error: "Slide not found" });

//     // Handle image update
//     if (file) {
//       // Delete old image
//       await deleteFirebaseFile(slide.image.firebasePath);

//       // Upload new image
//       const filename = `spinners/${name}/${Date.now()}_${file.originalname}`;
//       const firebaseFile = bucket.file(filename);
//       await firebaseFile.save(file.buffer, {
//         metadata: { contentType: file.mimetype },
//       });

//       const [url] = await firebaseFile.getSignedUrl({
//         action: "read",
//         expires: "03-09-2491",
//       });

//       imageUpdate = {
//         "slides.$.image.url": url,
//         "slides.$.image.firebasePath": filename,
//       };
//     }

//     // Update slide data
//     const updateData = {
//       ...req.body,
//       ...imageUpdate,
//     };

//     const updated = await Spinner.findOneAndUpdate(
//       { name, "slides._id": slideId },
//       { $set: updateData },
//       { new: true }
//     );

//     res.json(updated);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

const deleteSlide = async (req, res) => {
  try {
    const { name, slideId } = req.params;

    const spinner = await Spinner.findOne({ name });
    const slide = spinner.slides.id(slideId);

    if (!slide) return res.status(404).json({ error: "Slide not found" });

    // Delete from Firebase
    await deleteFirebaseFile(slide.image.firebasePath);

    // Remove from MongoDB
    const updated = await Spinner.findOneAndUpdate(
      { name },
      { $pull: { slides: { _id: slideId } } },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllSlides,
  getCarousel,
  addSlide,
  updateSlide,
  deleteSlide,
};
