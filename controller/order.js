// customer error messages
const { error } = require("../config/errorMessages");
const { orderStatuses } = require("../config/status");

// models
const Order = require("mongoose").model("Order");
const Product = require("mongoose").model("Product");
const Cart = require("mongoose").model("Cart");
const Business = require("mongoose").model("Business");

// utils
const populatePayment = require("../utils/paymentHelper");
const populateShipmentDetails = require("../utils/shipmentHelper");

/*
 * POST Method
 *
 * Client will send an object body
 *    items = [{id, quantity}]
 *    shippingDetails = {}
 *    paymentMethod = ""
 *    paymentDetails = {}
 *
 * This function will save the order to the Order table/schema.
 * It will also update and reduce the inventory of every ordered product's inventory.
 * The function also will remove the product from the user's cart, if they are in the cart.
 *
 */
exports.placeCustomerOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // const userId = "6127b3b64dfdba29d40a561b";
    const {
      items,
      shippingDetails,
      paymentMethod,
      paymentDetails,
      shippingFee,
    } = req.body;

    if (
      !items ||
      items.length <= 0 ||
      !shippingDetails ||
      !paymentDetails ||
      !paymentMethod ||
      !shippingFee
    )
      res.status(406).json({ error: error.incompleteData });
    else {
      let etaDate = new Date();
      const order = Order({
        _customer: userId,
        orderDate: Date.now(),
        ETADate: etaDate.setDate(etaDate.getDate() + 5),
        status: orderStatuses.PLACED.toUpperCase(), // set default status of an order
        shippingFee: null,
        shipmentDetails: {},
        paymentMethod: "",
        paymentInformation: "",
        orderedProducts: [],
      });

      // find products in items
      // we perform find even through items contains the price, because hackers might change the context value price of an item
      let products = await Product.find(
        {
          _id: { $in: items.map((e) => e.productId) },
        },
        "_inventory retailPrice"
      ).populate({
        path: "_inventory",
        select: "onHand",
        match: { onHand: { $gt: 0 } },
      });

      // remove empty inventory
      products = products.filter((e) => e._inventory.length > 0);

      // check if all the items were found
      if (products.length != items.length)
        res.status(406).json({ error: error.productNotFound });
      else {
        // build orderedProducts
        order.orderedProducts = products.map((e) => ({
          status: orderStatuses.PLACED.toUpperCase(),
          _product: e._id,
          priceAtPoint: e.retailPrice,
          rated: false,
          quantity: items.find((f) => f.productId == e._id).quantity,
        }));
      }

      // verify shipping fee
      order.shippingFee = shippingFee;
      if (isNaN(order.shippingFee))
        res.status(406).json({ error: error.serverError });

      // verify and populate shipment details
      order.shipmentDetails = populateShipmentDetails(shippingDetails);
      if (order.shipmentDetails === false)
        res.status(406).json({ error: error.invalidShipmentDetails });

      // verify and populate payment method
      order.paymentMethod = paymentMethod;
      order.paymentInformation = populatePayment(paymentMethod, paymentDetails);
      if (order.paymentInformation === false)
        res.status(406).json({ error: error.invalidPaymentDetails });

      // save the order
      await order.save();

      // we now need to remove the product, if it was in the user's cart
      const itemIds = items.map((e) => e.productId);
      await Cart.deleteMany({
        _id: { $in: req.user._cart },
        _product: { $in: itemIds },
      }).exec();

      res.status(200).json({
        orderId: order._id,
        message:
          "We have successfully processed and placed your order. Your order will have arive within 5 working days. Thank you!",
      });
    }
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ error: error.serverError });
  }
};

/*
 * GET Method
 *
 * A method that will query and return the 'UNSHIPPED' or unfulfilled
 * of that certain user.
 *
 * ORDER constitutes to unshipped or unfulfilled, while
 * PURCHASES constitutes to shipped or fulfilled
 */
exports.customerOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // const userId = "6127b3b64dfdba29d40a561b";

    const orders = await Order.find(
      { _customer: userId },
      "-_customer -paymentInformation.securityCode"
    )
      .populate({
        path: "orderedProducts._product",
        select: "item retailPrice imageAddress",
      })
      .exec();

    res.status(200).json({ orders });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: error.serverError });
  }
};

/*
 * GET METHOD, Seller auth
 *
 * A seller method placed inside this order.js file, instead of seller.js. However
 * it will still be called in the seller.js routes file
 *
 * This controller will retrieve all of the Placed ordered products of the current user-seller account.
 * Given that the Order data status is Placed, and the selected ordered product item(s) status is Placed.
 */
exports.sellerPendingOrders = async (req, res) => {
  try {
    if (!req.user) return res.status(404).json({ error: error.userNotFound });

    // find business
    const business = await Business.findOne(
      { _owner: req.user._id }, //
      "_id"
    ).exec();
    if (!business)
      return res.status(404).json({ error: error.sellerAccountMissing });

    // get the orders all of orders where
    // orderedproducts.status == PLACED, i.e., not yet shipped to warehouse
    // where orderedproducts._product(populate)._business == business._id
    let orders = await Order.find(
      { status: orderStatuses.PLACED.toUpperCase() },
      "status orderedProducts shipmentDetails paymentMethod"
    ).populate({
      path: "orderedProducts",
      select: "status _product priceAtPoint quantity",
      match: { status: orderStatuses.PLACED.toUpperCase() },
      populate: {
        path: "_product",
        select: "_business item imageAddress",
        match: { _business: business._id },
      },
    });

    // THIS LOGIC IS NOT FOR THIS GET METHOD, IT SHOULD BE FOR PATCH METHOD
    // // ordered products _products that are null are products not owned by this user/seller
    // orders = orders.map((order) => ({
    //   ...order._doc,
    //   orderedProducts: order.orderedProducts.map((product) => ({
    //     ...product._doc,
    //     status: product._product ? orderStatus[1] : product.status,
    //   })),
    // }));

    /*
     * remove ordered product where _product is null because that
     * means the ordered item is not for this seller
     */
    orders = orders.map((order) => ({
      ...order._doc,
      orderedProducts: order.orderedProducts.filter(
        (orderedProduct) => orderedProduct._product
      ),
      checked: false, // this field is for the frontend checkbox status
    }));

    // then do a check if orderedProducts is null, dont remove from orders
    orders = orders.filter((order) => order.orderedProducts.length > 0);

    return res.status(200).json({ orders });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: error.serverError });
  }
};
