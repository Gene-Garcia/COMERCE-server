// Package
const router = require("express").Router();

// Middleware
const { sellerAuthorize } = require("../middleware/auth");

// Controller
const {
  dashboard,
  findMyProducts,
  findMyProduct,
} = require("../controller/seller");

//Routes
router.get("/dashboard", sellerAuthorize, dashboard);
router.get("/products", sellerAuthorize, findMyProducts);
router.get("/product/:id", sellerAuthorize, findMyProduct);

module.exports = router;
