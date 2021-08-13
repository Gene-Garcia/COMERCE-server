// Package
const router = require("express").Router();

// Auth Middleware
const { authorize } = require("../middleware/auth");

// Controller
const {
  forgotPassword,
  resetPassword,
  changePassword,
  index,
} = require("../controller/user");

// Routes
router.get("/me", (req, res) => {});

// Password related routes
router.route("/password/forgot").post(forgotPassword);

router.route("/password/reset").put(resetPassword);

router.route("/password/change").post(authorize, changePassword);

// pages
router.route("/").get(authorize, index);

module.exports = router;
