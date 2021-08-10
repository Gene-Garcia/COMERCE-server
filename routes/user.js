// Package
const router = require("express").Router();

// Auth Middleware

// Controller
const { postForgotPassword, postResetPassword } = require("../controller/user");

// Routes
router.get("/me", (req, res) => {});

// Password related routes
router.route("/password/forgot").post(postForgotPassword);

router.route("/password/reset").post(postResetPassword);

module.exports = router;
