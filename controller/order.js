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
    // const userId = req.user._id;
    const userId = "6127b3b64dfdba29d40a561b";
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

      // find all products in items.id array
      // build a new product object with the embedded quantity, store only id
      // verify payment
      // verify shipment

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
      console.log(products);

      // check if all the items were found
      if (products.length != items.length)
        res.status(406).json({ error: error.productNotFound });
      else {
        // rebuild products
        // {_product: id, priceAtPoint: price, quantity: qty}
        order.orderedProducts = products.map((e) => ({
          _product: e._id,
          priceAtPoint: e.retailPrice,
          quantity: items.find((f) => f.productId == e._id).productId,
        }));
      }

      res.status(200).json({ order });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: error.serverError });
  }
};
