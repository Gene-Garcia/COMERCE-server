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
  getAllSellerOrders,
  getProductsOfOrder,
  getOtherBusinessInformation,
  updateBusinessInformation,
  getForPackOrders,
} = require("../controller/seller");
const { sellerPendingOrders, getOrderModal } = require("../controller/order");
const { shipProductOrders } = require("../controller/logistics");

//Routes
router.get("/dashboard", sellerAuthorize, dashboard);

router.get("/products", sellerAuthorize, findMyProducts);
router.get("/product/:id", sellerAuthorize, findMyProduct);

router.get("/inventories", sellerAuthorize, findMyInventories);

router.get("/orders/pending", sellerAuthorize, sellerPendingOrders);

router.get("/order/modal/:id", sellerAuthorize, getOrderModal);

router.get("/orders/master/:status", sellerAuthorize, getAllSellerOrders);
router.get(
  "/orders/master/products/:orderId",
  sellerAuthorize,
  getProductsOfOrder
);

router.patch("/logistics/ship", sellerAuthorize, shipProductOrders);
router.get("/logistics/for/pack", sellerAuthorize, getForPackOrders);

router.get(
  "/business/other-information",
  sellerAuthorize,
  getOtherBusinessInformation
);
router.patch("/business/update", sellerAuthorize, updateBusinessInformation);

module.exports = router;
