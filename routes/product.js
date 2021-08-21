// package
const router = require("express").Router();

// middleware
const { authorize } = require("../middleware/auth");

// controller
const { createProductAndInventory } = require("../controller/product");

// routes
// router.route("/shortcut/create").post(authorize, createProductAndInventory);
router.route("/shortcut/create").post(createProductAndInventory);

module.exports = router;
