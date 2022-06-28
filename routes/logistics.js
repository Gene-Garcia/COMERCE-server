// packages
const router = require("express").Router();

// authorize middleware
const { logisticsAuthorize, sellerAuthorize } = require("../middleware/auth");

// controllers
const {
  getForPickUpProducts,
  getWaybillData,
  packOrders,
} = require("../controller/logistics");

// route
router.get(
  "/waybill/seller/pick-up/order/:orders/products/:products",
  sellerAuthorize,
  getWaybillData
);

router.patch("/orders/update/pick-up", sellerAuthorize, packOrders);

router.get("/for-pick-up", logisticsAuthorize, getForPickUpProducts);

module.exports = router;
