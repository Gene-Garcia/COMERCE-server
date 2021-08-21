// package
const router = require("express").Router();

// middleware
const { authorize } = require("../middleware/auth");

// controller
const {
  createProductAndInventory,
  getAvailableProducts,
} = require("../controller/product");

// routes
router.route("/available").get(getAvailableProducts);

// router.route("/shortcut/create").post(authorize, createProductAndInventory);
router.route("/shortcut/create").post(createProductAndInventory);

module.exports = router;
