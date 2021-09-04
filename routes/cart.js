// packages
const router = require("express").Router();

// middleware
const { authorize } = require("../middleware/auth");

// controllers
const { addToCart, getNumberOfCartItem } = require("../controller/cart");

// route
router.patch("/add", authorize, addToCart);
// router.patch("/add", addToCart);

router.get("/count", authorize, getNumberOfCartItem);
// router.get("/count", getNumberOfCartItem);

module.exports = router;
