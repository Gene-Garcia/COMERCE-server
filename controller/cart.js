// Custom error messages
const { error } = require("../config/errorMessages");

// Model
const User = require("mongoose").model("User");
const Product = require("mongoose").model("Product");
const Cart = require("mongoose").model("Cart");

/*
 * PATCH Method, Authorized
 *
 * Updates the current cart of the user.
 * Regardless if:
 *    There is not cart record
 *    The product is the first item in the cart
 *    The product is already in the cart, it increments by one
 */
exports.addToCart = async (req, res, next) => {
  const userId = req.user._id;
  const productId = req.body.productId;

  if (!userId || !productId)
    res.status(406).json({ error: error.incompleteData });
  else {
    try {
      const user = await User.findById(userId).populate("_cart").exec();
      const product = await Product.findById(productId).exec();

      if (!user) res.status(404).json({ error: error.userNotFound });
      else if (!product) res.status(404).json({ error: error.productNotFound });
      else {
        // temporarily create a card record
        // will be saved later on, only when needed to save memory.
        const cart = Cart({
          _product: productId,
          quantity: 1,
          dateAdded: Date.now(),
        });

        // checks for cart instace or record in the user record
        if (user._cart && user._cart.length > 0) {
          // checks if the product is already in the user's cart
          const found = user._cart.find((d) => d._product == productId);

          if (found) {
            // finds the cart record to update it
            const thisCart = await Cart.findById(found._id).exec();

            // there was a record of an id in the user's _cart, but the Cart model does not have id
            if (!thisCart) res.status(500).json({ error: error.serverError });
            else {
              thisCart.quantity += 1;
              thisCart.dateAdded = Date.now();
              await thisCart.save();
            }
          } else {
            await cart.save();
            user._cart.push(cart._id);
            await user.save();
          }
        } else {
          await cart.save();
          user._cart.push(cart._id);
          await user.save();
        }

        // VERIFY IF NECESSARY TO SEND USER
        res.status(201).json({ user });
      }
    } catch (e) {
      res.status(500).json({ error: error.serverError });
    }
  }
};

/*
 * GET Method, Authorized
 *
 * Retrieves the total number of items, n = n + x.quantiy.
 * Where x is the cart item, and n is running total of items
 *
 * Only sends the count if a user found through req.user, which
 * is populated by the authorize middleware using JWT decode
 */
exports.getNumberOfCartItem = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).populate("_cart").exec();

    if (!user) res.status(404).json({ error: error.userNotFound });
    else {
      let count = 0;
      if (user._cart) user._cart.map((e) => (count += parseInt(e.quantity)));

      res.status(200).json({ count });
    }
  } catch (e) {
    res.status(500).json({ error: error.serverError });
  }
};

/*
 * GET Method, Authorized
 *
 */
exports.getUserCart = async (req, res, next) => {
  // const userId = req.user._id;
  const userId = "6127b3b64dfdba29d40a561b";

  try {
    /*
     * this cart is nested results of references
     * _cart: [
     *   {
     *     _product: {
     *       _inventory: [] or [{}, {}, {}]
     *     }
     *   },
     *
     *   {...},
     *
     *   ...
     * ]
     *
     */
    const cart = await User.findById(userId, "_cart").populate({
      path: "_cart",
      select: "_product quantity -_id",

      populate: {
        path: "_product",
        select: "item imageAddress retailPrice",

        populate: {
          path: "_inventory",
          select: "onHand -_id",
          match: { onHand: { $gt: 0 } },
        },
      },
    });

    // filter those that have no inventory
    const filtered = cart._cart.filter((e) => e._product._inventory.length > 0);

    // flatten object
    const flattened = filtered.map((e) => {
      return {
        productId: e._product._id,
        item: e._product.item,
        retailPrice: e._product.retailPrice,
        image: e._product.imageAddress,
        quantity: e.quantity,
        // inventories: _product._inventory
      };
    });

    res.status(200).json({ cart: flattened });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: error.serverError });
  }
};
