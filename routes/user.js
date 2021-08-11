// Package
const router = require("express").Router();

// Auth Middleware

// Controller
const { postForgotPassword, putResetPassword } = require("../controller/user");

// Routes
router.get("/me", (req, res) => {});

// Password related routes
router.route("/password/forgot").post(postForgotPassword);

router.route("/password/reset").put(putResetPassword);

module.exports = router;
