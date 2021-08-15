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
  userValidator,
} = require("../controller/user");

// Routes
router.get("/me", (req, res) => {});

// Password related routes
router.route("/password/forgot").post(forgotPassword);

router.route("/password/reset").put(resetPassword);

router.route("/password/change").post(authorize, changePassword);

// pages
router.route("/").get(authorize, index);

// This page is solely for validating the authorization of the user based on cookies
// this route will always be called by protected routes in frontend
router.route("/validate").get(authorize, userValidator);

module.exports = router;
