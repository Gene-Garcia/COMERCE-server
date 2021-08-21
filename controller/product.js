// Models
const User = require("mongoose").model("User");
const Product = require("mongoose").model("Product");
const Inventory = require("mongoose").model("Inventory");

// adds both a product and an inventory record
exports.createProductAndInventory = async (req, res, next) => {
  // const id = req.user._id
  const id = req.body.userId;

  // product model
  const { item, wholesaleCap, wholesalePrice, retailPrice, description } =
    req.body;
  // checks empty values
  if (!item || !wholesaleCap || !wholesalePrice || !retailPrice || !id)
    res.status(500).json({ success: false, error: "Incomplete data" });

  // inventory model
  const { quantity, onHand } = req.body;
  if (!quantity || !onHand)
    res.status(500).json({ success: false, error: "Incomplete data" });

  try {
    // create product
    const product = Product({
      _owner: id,
      item,
      wholesaleCap,
      wholesalePrice,
      retailPrice,
      description,
    });
    await product.save();

    // create inventory
    const inventory = Inventory({
      dateStored: Date.now(),
      quantity,
      onHand,
    });
    await inventory.save();

    // save to product
    product._inventory.push(inventory._id);
    await product.save();

    // success
    res
      .status(201)
      .json({
        success: true,
        message: "Succesfully created product and inventory",
        product,
        inventory,
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// returns product id
exports.createProduct = async (req, res, next) => {};

// creates an inventory record of product._id
exports.createInventory = async (req, res, next) => {};

// products of req.user._id
exports.findProduct = async (req, res, next) => {};

// products and inventories
exports.findMyProducts = async (req, res, next) => {};
