// Models
const Business = require("mongoose").model("Business");
const Product = require("mongoose").model("Product");
const Inventory = require("mongoose").model("Inventory");
const Order = require("mongoose").model("Order");

// utils
const { error } = require("../config/errorMessages");

/*
 * This controller-route is designed for the seller dashboard landing page.
 * It is planned to send data for charts and information.
 *
 * For now, it will only send the business information (logoAddress and name)
 */
exports.dashboard = async (req, res, next) => {
  try {
    if (!req.user) res.status(406).json({ error: error.serverError });

    const b = await Business.findOne({ _owner: req.user._id }).exec();

    if (!b) res.status(404).json({ error: error.sellerAccountMissing });

    res.status(200).json({ businessName: b.businessName, businessLogo: "" });
  } catch (e) {
    res.status(500).json({ error: error.serverError });
  }
};

// products and inventories
/*
 * GET, SELLER-auth Method
 *
 * retrieves and sends the products of this seller user
 */
exports.findMyProducts = async (req, res, next) => {
  try {
    if (!req.user) res.status(406).json({ error: error.incompleteData });

    // find the business
    const business = await Business.findOne(
      { _owner: req.user._id },
      "_id"
    ).exec();

    if (!business) res.status(406).json({ error: error.incompleteData });

    let products = await Product.find(
      { _business: business._id },
      "imageAddress item retailPrice wholesalePrice "
    )
      .populate({
        path: "_inventory",
      })
      .exec();

    // rebuild data for client
    const data = products.map((e) => {
      let inventory = 0;
      e._inventory.forEach((f) => (inventory += f.onHand));

      return {
        ...e._doc,
        inventory,
        _inventory: null, // so that we would not send the array anymore to the client
      };
    });

    res.status(200).json({ products: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: error.serverError });
  }
};

// products of req.user._id
/*
 * GET, SELLER-auth Method
 *
 * retrieves and send the product information of product id
 * in the paramater of the current seller user
 */
exports.findMyProduct = async (req, res, next) => {
  const productId = req.params.id;

  try {
    if (!productId)
      return res.status(406).json({ error: error.incompleteData });

    // validate, or maybe not because it would be redundant

    const product = await Product.findById(productId, "")
      .populate("_inventory")
      .exec();

    if (!product) return res.status(406).json({ error: error.productNotFound });

    return res.status(200).json({ product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: error.serverError });
  }
};

/*
 * GET, SELLER-auth Method
 *
 * retries and send all product's inventory of this user
 */
exports.findMyInventories = async (req, res, next) => {
  try {
    if (!req.user) return res.status(406).json({ error: error.incompleteData });

    // find and verify business
    const business = await Business.findOne(
      { _owner: req.user._id },
      "_id"
    ).exec();
    if (!business)
      return res.status(404).json({ error: error.sellerAccountMissing });

    let products = await Product.find(
      { _business: business._id },
      "item _inventory imageAddress"
    )
      .populate("_inventory")
      .exec();

    if (!products || products.length <= 0)
      return res.status(404).json({ error: error.productsNotFound });

    // rebuild object
    products = products.map((e) => {
      const onHand = e._inventory
        .map((f) => f.onHand)
        .reduce((prev, curr) => prev + curr, 0);

      const inventory = e._inventory
        .map((f) => f.quantity)
        .reduce((prev, curr) => prev + curr, 0);

      return { ...e._doc, inventory, onHand };
    });

    res.status(200).json({ products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: error.serverError });
  }
};

/*
 * GET, Seller-auth method
 *
 * retrieves all the orders this seller. the status of order will be based on route/:status
 */
exports.getAllSellerOrders = async (req, res) => {
  try {
    const status = req.params.status.toUpperCase();

    if (!status) return res.status(406).json({ error: error.incompleteData });

    // find business
    const business = await Business.findOne(
      { _owner: req.user._id },
      "_id"
    ).exec();

    if (!business)
      return res.status(404).json({ error: error.sellerAccountMissing });

    let orders = await Order.find(
      { status: status },
      `shipmentDetails.firstName shipmentDetails.lastName 
      shipmentDetails.province shipmentDetails.cityMunicipality 
      shipmentDetails.barangay status ETADate orderDate 
      paymentMethod orderedProducts._product 
      orderedProducts.priceAtPoint orderedProducts.quantity` // this works
    )
      .populate({
        path: "orderedProducts._product",
        select: "_business ", // this works
        match: { _business: business._id }, // this works too
      })
      .exec();

    // filter null orderedProducts._product because those are products not to this seller
    orders = orders.map((order) => ({
      ...order._doc,
      orderedProducts: order.orderedProducts.filter(
        (orderedProduct) => orderedProduct._product
      ),
    }));

    // filter null orders where orderedProducts is empty which would mean that the order has no products for this seller
    orders = orders.filter((order) => order.orderedProducts.length > 0);
    return res.status(200).json({ orders });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: error.serverError });
  }
};

/*
 * GET, seller-auth method
 *
 * retrieves the ordered products of an :orderId of the current user
 */
exports.getProductsOfOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    if (!orderId) return res.status(406).json({ error: error.incompleteData });

    const business = await Business.findOne({ _owner: req.user._id });

    if (!business)
      return res.status(404).json({ error: error.sellerAccountMissing });

    let order = await Order.findById(
      orderId,
      `shippingFee 
      orderedProducts.orderedProducts orderedProducts.status 
      orderedProducts.priceAtPoint orderedProducts.quantity`
    ).populate({
      path: "orderedProducts._product",
      select: "_business imageAddress item",
      match: { _business: business._id },
    });

    // logically, the order id sent is reference to an order with orderedProducts to this seller
    // so we only need to do filtering on orderedProducts to get only the orderedProducts of this seller
    // it is guaranteed that atleast 1 product from the order will be returned
    order = {
      ...order._doc,
      orderedProducts: order.orderedProducts.filter(
        (product) => product._product
      ),
    };

    return res.status(200).json({ order });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: error.serverError });
  }
};
