// packages
const router = require("express").Router();

// authorize middleware
const { logisticsAuthorize } = require("../middleware/auth");

// controllers
const { getForPickUpProducts } = require("../controller/logistics");

// route
router.get("/for-pick-up", logisticsAuthorize, getForPickUpProducts);

module.exports = router;
