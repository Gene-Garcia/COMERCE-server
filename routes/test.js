// Packages
const route = require("express").Router();

// Auth middleware
const { authorize } = require("../middleware/auth");

// controller

// Routes
route.get("/private", authorize, (req, res, next) => {
  res.send("Authorize");
});

module.exports = route;
