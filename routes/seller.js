// Package
const router = require("express").Router();

// Middleware
const { sellerAuthorize } = require("../middleware/auth");

// Controller
const { dashboard } = require("../controller/seller");

//Routes
router.get("/dashboard", sellerAuthorize, dashboard);

module.exports = router;
