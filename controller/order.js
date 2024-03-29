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
const util = require("util");

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
 * Notably, the orderedproduct status must have a status of PLACED. The status of the parent will be disregarded for this
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

    /*
     * get the orders all of orders where
     * Just to narrow order selection
     * Only get orders whose are either PLACED, LOGISTICS, or WAREHOUSE.
     * these 3 status indicate the order is not yet receive by the customer, hence,
     * some of the products that comes with it will either have these 3 status.
     * If the order is already RATED or FULFILLED then this would indicate that the
     * Logistic or shipment process is already out of question or done for this order
     * where orderedproducts._product(populate)._business == business._id
     */
    let orders = await Order.find(
      {
        status: {
          $in: [
            orderStatuses.PLACED,
            orderStatuses.LOGISTICS,
            orderStatuses.WAREHOUSE,
          ],
        },
      },
      `orderedProducts.status orderedProducts._product
       paymentMethod orderDate ETADate
       shipmentDetails.firstName shipmentDetails.lastName
       shipmentDetails.barangay shipmentDetails.cityMunicipality shipmentDetails.province`
    ).populate({
      path: "orderedProducts._product",
      select: "_business item imageAddress",
      match: {
        _business: business._id,
      },
    });

    /*
     * remove ordered product where _product is null because that
     * means that any ordered item is not for this seller
     *
     * And
     *
     * another condition to filter only those products with an orderedProduct status of PLACED
     * We are unable to filter orderedProducts === PLACED in mongo query because
     * it does find orderedProducts objects with status of PLACED but includes the entire array
     * with it
     */
    orders = orders.map((order) => ({
      ...order._doc,
      orderedProducts: order.orderedProducts.filter(
        (orderedProduct) =>
          orderedProduct._product &&
          orderedProduct.status.toUpperCase() === orderStatuses.PLACED
      ),
      checked: false, // this field is for the frontend checkbox status
    }));

    // then do a check if orderedProducts is null, dont remove from orders
    orders = orders.filter((order) => order.orderedProducts.length > 0);

    return res.status(200).json({ orders });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: error.serverError });
  }
};

/*
 * GET Method, Seller Auth
 *
 * Retrieves data for order modal. Expects an orderId parameter
 */
exports.getOrderModal = async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log("order id", orderId);

    if (!orderId)
      return res.status(406).json({ message: error.incompleteData });

    // validate seller account
    const business = await Business.findOne(
      { _owner: req.user._id },
      "_id"
    ).exec();
    if (!business)
      return res.status(404).json({ message: error.sellerAccountMissing });

    const order = await Order.findById(
      orderId,
      `orderedProducts._product orderedProducts.priceAtPoint orderedProducts.quantity
      paymentMethod shipmentDetails shippingFee`
    ).populate({
      path: "orderedProducts._product",
      match: { _business: business._id },
      select: "item imageAddress",
    });

    // filter products not to this seller-business
    order.orderedProducts = order.orderedProducts.filter(
      (orderedProduct) => orderedProduct._product
    );

    return res.status(200).json({ order });
  } catch (e) {
    console.log(e.message);
    return res.status(500).json({ message: e.message });
  }
};
