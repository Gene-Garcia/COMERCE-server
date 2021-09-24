// package
const router = require("express").Router();

// middleware
const { authorize } = require("../middleware/auth");

// controller
const { placeCustomerOrder } = require("../controller/order");

// routes
router.route("/place").post(authorize, placeCustomerOrder);
// router.route("/place").post(placeCustomerOrder);

module.exports = router;
