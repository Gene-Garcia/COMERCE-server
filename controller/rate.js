// models
const Order = require("mongoose").model("Order");
const Product = require("mongoose").model("Product");

// constants
const { error } = require("../config/errorMessages");
const { orderStatuses } = require("../config/status");

/*
 * GET Method
 *
 * The function controller retrieves data from the Order model with reference to the user.
 * Then, based on the status field ("Placed", "Logistics", "Review", "Fulfilled") if "Review" then will
 * retrieve ordereredProducts._product of that.
 *
 * Additionally, the orderedProducts has a 'rated' (bool) field which would indicate whether that product,
 * which is part of the "Review" status, has  already been rated or not.
 *
 * An order may still be "Review" but some orderedProducts, but not all, may already have rated of true.
 * In the post function to post rate, after saving the rate of the product, it will check if all orderedProducts
 * are rated, then change status to Fulfilled.
 *
 * Returns a custom and flattened object of a product to be rated
 */
exports.getUserToRateProduct = async (req, res, next) => {
  const userId = req.user._id;

  try {
    // get user's order that has a status of Review
    // populate orderedProducts that has rate === true
    // get those products
    let orders = await Order.find(
      {
        _customer: userId,
        status: orderStatuses.REVIEW.toUpperCase(), // only those for REVIEW orders
      },
      "status orderDate ETADate orderedProducts.rated orderedProducts._product"
    ).populate({
      path: "orderedProducts._product",
      select: "item imageAddress retailPrice",
    });

    // flattens the data into client-ready object
    // orderId and dates of the order are redundantly stored in each products
    // so that client can easily access the order information of each product
    let products = [];
    orders.forEach((e) => {
      const base = {
        orderId: e._id,
        orderDate: e.orderDate,
        ETADate: e.ETADate,
        rated: false, // an identifier variable that will tell if this product in the frontend has already been submitted for rating by them.
        // hence, the frontend would be able to not show, again, this product from the products returned from by this controller
      };

      e.orderedProducts.forEach(({ _product: f, rated }) => {
        if (!rated)
          products.push({
            ...base,
            productId: f._id,
            item: f.item,
            imageAddress: f.imageAddress,
            retailPrice: f.retailPrice,
          });
      });
    });

    res.status(200).json({ products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: error.serverError });
  }
};

/*
 * PATCH Method
 *
 * req.product, req.comment, & req.rating
 *
 * The patch function that updates the Product model from the user's order.orderedProducts
 * It also updates the user Order model's status, and its order.orderedProducts.rated of the current product
 * to be rated.
 *
 * Subsequently, the function will iterate through all the orderedProducts to check if each rated are all true,
 * then, if all true than will change the order.status to Fullfilled.
 *
 * the comment part is not yet implemented.
 *
 */
exports.rateOrderProduct = async (req, res, next) => {
  // find product, append rating

  // find order
  // find product in orderedProducts -no need to populate
  // set rated to true
  // check if all orderedProducts.rated in orderedProducts are true
  // then, set the order's status to Fulfilled
  // save order

  try {
    const { product, comment, rating } = req.body;

    if (!product || !rating)
      res.status(406).json({ error: error.incompleteData });
    else {
      // find order of the product
      const order = await Order.findById(
        product.orderId,
        "status orderedProducts"
      ).exec();

      // check each orderedProducts and find product then change rated to true
      // in the same loop check also if all the products are rated -this is the reason why iteration needs to continue even if product is already found
      let allRated = true;
      order.orderedProducts.forEach((e) => {
        // product found
        if (e._product == product.productId) e.rated = true;

        // to check if all products are rated
        if (e.rated === false) allRated = false;
      });

      // update status of order depending on 'allRated'
      if (allRated) order.status = orderStatuses.FULFILLED.toUpperCase();

      // find product and insert rating
      // COMMENT WILL NOT YET BE IMPLEMENTED
      const dbProduct = await Product.findById(product.productId, "rating");
      dbProduct.rating.push(rating);

      // save
      await dbProduct.save();
      await order.save();

      res.status(200).json({
        message:
          "Thank you, your rating to our product have been received successfully.",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: error.serverError });
  }
};
