// Package
const router = require("express").Router();

// Middleware
const { sellerAuthorize } = require("../middleware/auth");

// Controller
const {} = require("../controller/seller");

//Routes

module.exports = router;
