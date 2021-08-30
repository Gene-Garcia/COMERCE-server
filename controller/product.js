// Models
const User = require("mongoose").model("User");
const Product = require("mongoose").model("Product");
const Inventory = require("mongoose").model("Inventory");

// get all products that has ANY inventory record that have more than 1 onHand product
exports.getAvailableProducts = async (req, res, next) => {
  // no auth
  try {
    const products = await Product.find(
      {},
      "rating _inventory item imageAddress retailPrice description"
    )
      .populate({ path: "_inventory", match: { onHand: { $gt: 0 } } })
      .exec();

    // there will be products that null inventory, which means they have 0 or less than onHand quantity
    const available = products.filter((item) => item._inventory.length > 0);

    res.status(200).json({ succes: true, available });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// adds both a product and an inventory record
exports.createProductAndInventory = async (req, res, next) => {
  // const id = req.user._id
  const id = req.body.userId;

  // product model
  const {
    item,
    wholesaleCap,
    wholesalePrice,
    retailPrice,
    description,
    imageAddress,
  } = req.body;
  // checks empty values
  if (
    !item ||
    !wholesaleCap ||
    !wholesalePrice ||
    !retailPrice ||
    !imageAddress ||
    !id
  )
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
      imageAddress,
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
    res.status(201).json({
      success: true,
      message: "Succesfully created product and inventory",
      product,
      inventory,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// get product with product id
exports.getProduct = async (req, res, next) => {
  const productId = req.params.pId;

  if (!productId)
    res.status(404).json({ success: false, error: "Incomplete data." });
  else {
    try {
      const product = await Product.findById(productId)
        .populate("_inventory")
        .exec();

      if (!product)
        res.status(404).json({ success: false, error: "Product not found." });
      else res.status(200).json({ success: true, product });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
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
