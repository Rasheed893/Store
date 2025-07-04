const ShippingRate = require("./shippingRate.model");
const { moduel } = require("mongoose");

const addShippingRate = async (req, res) => {
  const { city, price } = req.body;
  try {
    const exists = await ShippingRate.findOne({ city });
    if (exists) return res.status(400).json({ error: "City already exists" });

    const rate = new ShippingRate({ city, price });
    await rate.save();
    res.json(rate);
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
};
const getShippingRate = async (req, res) => {
  try {
    const rates = await ShippingRate.find({});
    const shippingPrices = {};
    rates.forEach((rate) => {
      shippingPrices[rate.city] = rate.price;
    });
    res.json(shippingPrices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const editShippingRate = async (req, res) => {
  const { price } = req.body;
  try {
    const updated = await ShippingRate.findByIdAndUpdate(
      req.params.id,
      { price },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const deleteShippingRate = async (req, res) => {
  try {
    await ShippingRate.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addShippingRate,
  getShippingRate,
  editShippingRate,
  deleteShippingRate,
};
