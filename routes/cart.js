// packages
const router = require("express").Router();

// middleware
const { authorize } = require("../middleware/auth");

// controllers
const { addToCart } = require("../controller/cart");

// route
// router.patch("/add", authorize, addToCart);
router.patch("/add", addToCart);

module.exports = router;
