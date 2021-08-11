// Package
const router = require("express").Router();

// Auth Middleware

// Controller
const { forgotPassword, resetPassword } = require("../controller/user");

// Routes
router.get("/me", (req, res) => {});

// Password related routes
router.route("/password/forgot").post(forgotPassword);

router.route("/password/reset").put(resetPassword);

module.exports = router;
