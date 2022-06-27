// packages
const router = require("express").Router();

// authorize middleware
const { logisticsAuthorize, sellerAuthorize } = require("../middleware/auth");

// controllers
const {
  getForPickUpProducts,
  getWaybillData,
  testGetWaybillData,
} = require("../controller/logistics");

// route
router.get(
  "/waybill/seller/pick-up/order/:orders/products/:products",
  sellerAuthorize,
  getWaybillData
);
// router.get("/waybill/customer/delivery")

router.get("/for-pick-up", logisticsAuthorize, getForPickUpProducts);

module.exports = router;
