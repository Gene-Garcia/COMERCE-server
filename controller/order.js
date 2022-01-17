// customer error messages
const { error } = require("../config/errorMessages");
const { orderStatus } = require("../config/status");

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
        status: orderStatus[0], // placed
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
        // rebuild products
        order.orderedProducts = products.map((e) => ({
          status: orderStatus[0],
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
