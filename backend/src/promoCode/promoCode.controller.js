const PromoCode = require("../promoCode/promoCode.model");
const { moduel } = require("mongoose");
const bucket = require("../firebase/config");

// Generate a promo code
const createPromoCode = async (req, res) => {
  const {
    code,
    discountPercentage,
    freeShipping,
    promoDescription,
    expiresAt,
  } = req.body;

  try {
    // Check if essential fields are present (not undefined or null)
    if (
      code === undefined ||
      discountPercentage === undefined ||
      promoDescription === undefined ||
      expiresAt === undefined
    ) {
      return res.status(400).json({
        message:
          "Missing required fields: code, discountPercentage, and expiresAt are mandatory.",
      });
    }

    // freeShipping can be false, so it doesn't need to be checked in the same way
    // If it's missing, the schema default will handle it.
    // If you want to explicitly check if freeShipping was provided, you can do:
    // if (freeShipping === undefined) { /* handle if it's strictly required */ }

    const existing = await PromoCode.findOne({ code });
    if (existing) {
      return res.status(409).json({ message: "Code already exists" });
    }

    const promo = await PromoCode.create({
      code: code.toUpperCase(),
      discountPercentage,
      // Use the provided freeShipping value or default to false if not provided
      freeShipping: freeShipping !== undefined ? freeShipping : false,
      promoDescription,
      expiresAt,
      usedBy: [],
    });

    res.status(201).json({ message: "Promo created", promo });
  } catch (error) {
    console.error("Couldn't create promo code", error);
    res.status(500).send({ message: "Error creating promo code", error });
  }
};

//Validate promo code
const validatePromoCode = async (req, res) => {
  try {
    console.log("➡️ validatePromoCode called");

    const { code, userId } = req.body;
    // console.log("Code:", code, "| UserID:", userId);

    const promo = await PromoCode.findOne({ code });
    // console.log("Promo fetched:", promo);

    if (!promo || new Date(promo.expiresAt) < new Date()) {
      // console.log("❌ Promo not found or expired");
      return res
        .status(400)
        .json({ error: "Promo code is invalid or expired." });
    }
    // console.log("🔍 promo.usedBy raw:", promo.usedBy);
    // console.log("🔍 checking against userId:", userId);

    if (promo.usedBy.some((u) => u.toLowerCase() === userId.toLowerCase())) {
      // console.log("❌ Promo already used by this user");
      return res
        .status(400)
        .json({ error: "You’ve already used this promo code." });
    }

    console.log(
      "✅ Promo valid. Returning discount:",
      promo.discountPercentage
    );
    return res.json({
      discountPercentage: promo.discountPercentage,
      freeShipping: promo.freeShipping || false,
    });
  } catch (error) {
    console.error("❌ Couldn't validate promo code", error);
    res.status(500).send({ message: "Error validating promo code", error });
  }
};

// Get all promo codes
const getAllAvailablePromos = async (req, res) => {
  try {
    const today = new Date();
    const promos = await PromoCode.find({
      expiresAt: { $gte: today },
    }).select("code discountPercentage freeShipping promoDescription");

    res.status(200).json(promos);
  } catch (error) {
    console.error("Error fetching promos:", error);
    res.status(500).json({ message: "Failed to fetch promo codes" });
  }
};

module.exports = {
  validatePromoCode,
  createPromoCode,
  getAllAvailablePromos,
};
