// Package
const router = require("express").Router();

// Middleware
const { sellerAuthorize } = require("../middleware/auth");

// Controller
const {
  dashboard,
  findMyProducts,
  findMyProduct,
  findMyInventories,
} = require("../controller/seller");

//Routes
router.get("/dashboard", sellerAuthorize, dashboard);
router.get("/products", sellerAuthorize, findMyProducts);
router.get("/product/:id", sellerAuthorize, findMyProduct);
router.get("/inventories", sellerAuthorize, findMyInventories);

module.exports = router;
