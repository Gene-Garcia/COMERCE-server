// Custom error messages
const { error } = require("../config/errorMessages");
const { validateNewProductData } = require("../utils/productHelper");

// Models
const Product = require("mongoose").model("Product");
const Inventory = require("mongoose").model("Inventory");
const Business = require("mongoose").model("Business");

/*
 * GET Method
 *
 * Gets all the available items record in the Product model.
 * However, the product must have an inventory.onHand value of more than 0.
 *
 * New functionality: sends only certain number of products part in some index computed by pages
 * the parameters:
 *  page - will be used to compute on which indexes the products to return.
 *         the startIndex and endIndex computed will be used to filter all the queried products.
 *
 *  limit - is also used in computing the start and end index of products to return.
 *          logically the limit is the step of products to be returned, then page is used
 *          increase the step. E.g., for page 1 with step/limit 5 will be 0-4, then page 2 will be 5 - n, so on.
 *
 */
exports.getAvailableProducts = async (req, res, next) => {
  const page = parseInt(req.params.page);
  const limit = parseInt(req.params.limit);

  try {
    // filering the populate method using {$gt} still includes 'that' product, but will return a null inventory
    const products = await Product.find(
      {},
      "rating _inventory item imageAddress retailPrice description"
    )
      .populate({
        path: "_inventory",
        select: "onHand",
        match: { onHand: { $gt: 0 } },
      })
      .exec();

    // filters the products object to only those have an _inventory record.
    // products will have a null _inventory because they were filtered using {$gt}
    let available = products.filter((item) => item._inventory.length > 0);

    /*
     * compute the indexes of the product include on this pagination's page
     * formula x*y = n, where x is the page, y is the limit, and n is the end index.
     * indexes are [o,n] where o is (x-1*y)-1 = o. -1 is necessary to actually limit to no more than 16 productss
     */
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit - 1;

    // create a seperate array of the products to be included in the limit
    // done after filtering empty inventory so that we exclude not available products in the computation
    const productsOnPage = available.filter(
      (e, i) => i >= startIndex && i <= endIndex
    );

    res
      .status(200)
      .json({ available: productsOnPage, productCount: available.length });
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
    // find the business record of the user id
    const business = await Business.find({ _owner: id }, "_id").exec();

    // create product
    const product = Product({
      _owner: business._id,
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
      const product = await Product.findById(
        productId,
        "rating item retailPrice description imageAddress"
      )
        .populate({ path: "_inventory", select: "onHand" })
        .exec();

      if (!product) res.status(404).json({ error: error.productNotFound });
      else res.status(200).json({ product });
    } catch (e) {
      res.status(500).json({ error: error.serverError });
    }
  }
};

/*
 * POST, SELLER-auth Method
 *
 * Creates the product record referenced to the logged in seller user
 * then an inventory record will be created in reference to that product
 */
exports.uploadProductWithInventory = async (req, res, next) => {
  const data = req.body.data;

  try {
    if (!validateNewProductData(data) || !req.user)
      return res.status(406).json({ error: error.incompleteData });

    // validate if req.user has a business record. this is just an extra measure
    const business = await Business.findOne({ _owner: req.user._id });

    if (!business) return res.status(406).json({ error: error.incompleteData });

    const {
      item,
      retailPrice,
      wholesalePrice,
      wholesaleCap,
      description,
      inventory,
      imageAddress,

      brand,
      category,
      keywords,
    } = data;

    // create product
    const product = Product({
      _business: business._id,
      imageAddress,
      item,
      wholesaleCap,
      wholesalePrice,
      retailPrice,
      brand,
      keywords,
      category,
      description,
    });

    // create inventory
    const prodInventory = Inventory({
      dateStored: Date.now(),
      quantity: inventory,
      onHand: inventory,
    });

    // update reference
    product._inventory.push(prodInventory);

    // save
    await prodInventory.save();
    await product.save();

    res
      .status(201)
      .json({ message: `Succesfully added new product: ${product.item}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: error.serverError });
  }
};

/*
 * PATCH, SELLER-auth
 *
 * creates new Inventory record, and then reference and save it to
 * the product.
 */
exports.addInventory = async (req, res, next) => {
  const { productId, onHand, inventory } = req.body;

  try {
    if (!req.user) return res.status(406).json({ error: error.incompleteData });

    if (!productId || !onHand || !inventory)
      return res.status(406).json({ error: error.incompleteData });

    if (isNaN(onHand) || isNaN(inventory))
      return res.status(406).json({
        error:
          "Invalid form data. Please double check the inventory information and try again. If errors persists contact our customer support.",
      });

    // find the product
    const product = await Product.findById(productId, "_inventory item").exec();
    if (!product) return res.status(406).json({ error: error.productNotFound });

    // create inventory
    const onHandNum = parseInt(onHand);
    const inventoryNum = parseInt(inventory);
    const inventoryRec = Inventory({
      dateStored: Date.now(),
      quantity: inventoryNum,
      onHand: onHandNum,
    });
    await inventoryRec.save();

    // reference new inventory to product
    product._inventory.push(inventoryRec);
    await product.save();

    return res.status(201).json({
      message: `Successfully added new inventory with a quantity of ${inventoryRec.quantity} to item ${product.item}`,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: error.serverError });
  }
};
