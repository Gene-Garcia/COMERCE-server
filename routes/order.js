// package
const router = require("express").Router();

// middleware
const { authorize } = require("../middleware/auth");

// controller
const { placeCustomerOrder, customerOrders } = require("../controller/order");

// routes
router.route("/place").post(authorize, placeCustomerOrder);
router.route("/orders").get(authorize, customerOrders);


module.exports = router;
