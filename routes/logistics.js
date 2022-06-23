// packages
const router = require("express").Router();

// authorize middleware
const { logisticsAuthorize, sellerAuthorize } = require("../middleware/auth");

// controllers
const {
  getForPickUpProducts,
  getWaybillData,
} = require("../controller/logistics");

// route
router.get(
  sellerAuthorize,
  "/waybill/seller/pick-up/order/:orderId/products/:products",
  getWaybillData
);
// router.get("/waybill/customer/delivery")

router.get("/for-pick-up", logisticsAuthorize, getForPickUpProducts);

module.exports = router;
