// customer error messages
const { error } = require("../config/errorMessages");

// models
const Order = require("mongoose").model("Order");
const Product = require("mongoose").model("Product");

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
 */
exports.placeCustomerOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // const userId = "6127b3b64dfdba29d40a561b";
    const { items, shippingDetails, paymentMethod, paymentDetails } = req.body;

    if (
      !items ||
      items.length <= 0 ||
      !shippingDetails ||
      !paymentDetails ||
      !paymentMethod
    )
      res.status(406).json({ error: error.incompleteData });
    else {
      let etaDate = new Date();
      const order = Order({
        _customer: userId,
        orderDate: Date.now(),
        ETADate: etaDate.setDate(etaDate.getDate() + 5),
        shipmentDetails: {},
        paymentMethod: "",
        paymentInformation: "",
        orderedProducts: [],
      });

      // find products in items
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
          _product: e._id,
          priceAtPoint: e.retailPrice,
          quantity: items.find((f) => f.productId == e._id).quantity,
        }));
      }

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

      res
        .status(200)
        .json({
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
