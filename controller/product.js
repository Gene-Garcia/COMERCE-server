// Custom error messages
const { error } = require("../config/errorMessages");

// Models
const Product = require("mongoose").model("Product");
const Inventory = require("mongoose").model("Inventory");

/*
 * GET Method
 *
 * Gets all the available items record in the Product model.
 * However, the product must have an inventory.onHand value of more than 0.
 */
exports.getAvailableProducts = async (req, res, next) => {
  try {
    // filering the populate method using {$gt} still includes 'that' product, but will return a null inventory
    const products = await Product.find(
      {},
      "rating _inventory item imageAddress retailPrice description"
    )
      .populate({ path: "_inventory", match: { onHand: { $gt: 0 } } })
      .exec();

    // filters the products object to only those have an _inventory record.
    // products will have a null _inventory because they were filtered using {$gt}
    const available = products.filter((item) => item._inventory.length > 0);

    res.status(200).json({ available });
  } catch (e) {
    res.status(500).json({ error: error.serverError });
  }
};

// adds both a product and an inventory record
/*
 * POST method
 *
 * A convenience method that is mostly used in development to add product and
 * its inventory in one request.
 *
 * Only used in development because views for adding product and inventory both
 * in the frontend and backend is not yet implemented.
 */
exports.createProductAndInventory = async (req, res, next) => {
  // const id = req.body.userId;
  const id = "6127b3b64dfdba29d40a561b";
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
    res.status(406).json({ error: error.incompleteData });

  // inventory model
  const { quantity, onHand } = req.body;
  if (!quantity || !onHand)
    res.status(406).json({ error: error.incompleteData });

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
  } catch (e) {
    res.status(500).json({ error: error.serverError });
  }
};

/*
 * GET Method
 *
 * Retrieves a product record from the database using the paramater
 * that contains the product's id.
 *
 * Primarily used for displaying an item in the client.
 */
exports.getProduct = async (req, res, next) => {
  const productId = req.params.pId;

  if (!productId) res.status(406).json({ error: error.incompleteData });
  else {
    try {
      const product = await Product.findById(productId)
        .populate("_inventory")
        .exec();

      if (!product) res.status(404).json({ error: error.productNotFound });
      else res.status(200).json({ product });
    } catch (e) {
      res.status(500).json({ error: error.serverError });
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
