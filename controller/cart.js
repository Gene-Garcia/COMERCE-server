// Model
const User = require("mongoose").model("User");
const Product = require("mongoose").model("Product");
const Cart = require("mongoose").model("Cart");

// add to cart, patch
exports.addToCart = async (req, res, next) => {
  // userid, productid

  //const userId = req.user._id;
  const userId = req.body.userId;
  const productId = req.body.productId;

  if (!userId || !productId)
    res.status(404).json({ success: false, error: "Incomplete data." });

  try {
    const user = await User.findById(userId).populate("_cart").exec();
    const product = await Product.findById(productId).exec();

    if (!user)
      res.status(404).json({ success: false, error: "User not found." });
    else if (!product)
      res.status(404).json({ success: false, error: "Product not found." });
    else {
      // temporarily create a card record
      const cart = Cart({
        _product: productId,
        quantity: 1,
        dateAdded: Date.now(),
      });

      // check if there is cart record
      // // then check if this product is already there
      // // // then just update it's quantity and date
      // // else
      // // // create a cart record, and save it to user._cart
      // else
      // // create a cart record and save it to user._cart

      if (user._cart && user._cart.length > 0) {
        const found = user._cart.find((d) => d._product == productId);

        if (found) {
          // find that cart record to update it
          const thisCart = await Cart.findById(found._id).exec();

          if (!thisCart)
            res
              .status(500)
              .json({ success: false, error: "Something went wrong." });
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

      res.status(201).json({ success: true, user });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
