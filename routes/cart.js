// packages
const router = require("express").Router();

// middleware
const { authorize } = require("../middleware/auth");

// controllers
const {
  addToCart,
  getNumberOfCartItem,
  getUserCart,
  getItemsForCheckout,
  removeFromCart,
} = require("../controller/cart");

// route
router.post("/products", authorize, getItemsForCheckout);
router.patch("/add", authorize, addToCart);
router.get("/count", authorize, getNumberOfCartItem);
router.get("/user", authorize, getUserCart);
router.delete("/remove/:cartId", authorize, removeFromCart);

module.exports = router;
