// packages
const router = require("express").Router();

// middleware
const { authorize } = require("../middleware/auth");

// controllers
const {
  addToCart,
  getNumberOfCartItem,
  getUserCart,
  getCartItem,
} = require("../controller/cart");

// route
router.patch("/add", authorize, addToCart);
router.get("/count", authorize, getNumberOfCartItem);
router.get("/user", authorize, getUserCart);
router.get("/product", authorize, getCartItem);

module.exports = router;
