// packages
const router = require("express").Router();

// middleware
const { authorize, sellerAuthorize } = require("../middleware/auth");

// controller
const {
  createProductAndInventory,
  getAvailableProducts,
  getProduct,
  uploadProductWithInventory,
} = require("../controller/product");

// routes
router.route("/available/:limit/:page").get(getAvailableProducts);
router.route("/item/:pId").get(getProduct);
router.post("/upload", sellerAuthorize, uploadProductWithInventory);
// router.route("/shortcut/create").post(authorize, createProductAndInventory);
router.route("/shortcut/create").post(createProductAndInventory);

module.exports = router;
