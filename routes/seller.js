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
const {
  sellerPendingOrders,
  findOrderForSeller,
} = require("../controller/order");
const { shipProductOrders } = require("../controller/logistics");

//Routes
router.get("/dashboard", sellerAuthorize, dashboard);
router.get("/products", sellerAuthorize, findMyProducts);
router.get("/product/:id", sellerAuthorize, findMyProduct);
router.get("/inventories", sellerAuthorize, findMyInventories);
router.get("/orders/pending", sellerAuthorize, sellerPendingOrders);
router.get("/orders/order/:orderId", sellerAuthorize, findOrderForSeller);

router.patch("/logistics/ship", sellerAuthorize, shipProductOrders);
module.exports = router;
