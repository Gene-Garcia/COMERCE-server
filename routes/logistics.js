// packages
const router = require("express").Router();

// authorize middleware
const { logisticsAuthorize, sellerAuthorize } = require("../middleware/auth");

// controllers
const {
  getForPickUpProducts,
  getWaybillData,
  packOrders,
  pickUpProducts,
} = require("../controller/logistics");

// route
router.get(
  "/waybill/seller/order/:orders/products/:products",
  sellerAuthorize,
  getWaybillData
);

router.patch("/orders/pack", sellerAuthorize, packOrders);

router.get("/for-pick-up", logisticsAuthorize, getForPickUpProducts);

router.post("/orders/pick-up", logisticsAuthorize, pickUpProducts);

module.exports = router;
