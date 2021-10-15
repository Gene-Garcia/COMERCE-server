const router = require("express").Router();

// middleware
const { authorize } = require("../middleware/auth");

// controllers
const {
  getUserToRateProduct,
  rateOrderProduct,
} = require("../controller/rate");

// utils

// routes
router.get("/unrated", authorize, getUserToRateProduct);
router.patch("/save", authorize, rateOrderProduct);
module.exports = router;
