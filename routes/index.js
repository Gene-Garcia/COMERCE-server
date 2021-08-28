require("dotenv").config();

const router = require("express").Router();

// midlleware
const { authorize } = require("../middleware/auth");

// Controller
const { signin, signup, signout } = require("../controller/user");

router.post("/signup", signup);

router.post("/signin", signin);

router.get("/signout", authorize, signout);

// security csurf
router.get("/cs", (req, res) => {
  const csrf = req.csrfToken();

  // console.log(csrf);
  // res.cookie("csrfcmrc", csrf);
  res.cookie("XSRF-TOKEN", csrf, { httpOnly: true });
  res.status(200).json({ success: true, csrfToken: csrf });
});

module.exports = router;
