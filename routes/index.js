// Packages
require("dotenv").config();
const router = require("express").Router();

// Midlleware
const { authorize } = require("../middleware/auth");

// Controller
const { signin, signup, signout } = require("../controller/user");

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/signout", authorize, signout);

// security csurf
router.get("/cs", (req, res) => {
  const csrf = req.csrfToken();

  // the following commented lines of codes was attempted to set the csrf token through the server, but was failure.
  // it really needed to be set by the frontent API caller like axios
  // res.cookie("csrfcmrc", csrf);
  // res.cookie("X-CSRF-Token", csrf);
  // res.cookie("_csrf", csrf);

  // however, if we were to print the axios.defaults in the frontend
  // it will show that the cookie name for csrf token they use is 'XSRF-TOKEN'
  // which definitely works even when we dont set it manually in the header.
  res.cookie("XSRF-TOKEN", csrf);
  res.status(200).json();
});

module.exports = router;
