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
  getLogisticsWithMe,
  recordFailedAttempts,
} = require("../controller/logistics");

// route
router.get(
  "/waybill/orders/:orders/products/:products",
  sellerAuthorize,
  getWaybillData
);

router.patch("/pack", sellerAuthorize, packOrders);

router.get("/for-pick-up", logisticsAuthorize, getForPickUpProducts);

router.post("/orders/pick-up", logisticsAuthorize, pickUpProducts);

router.get("/with-me/:logisticsType", logisticsAuthorize, getLogisticsWithMe);

router.patch("/delivery/attempt", logisticsAuthorize, recordFailedAttempts);

module.exports = router;
