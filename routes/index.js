require("dotenv").config();

const router = require("express").Router();

const { signin, signup } = require("../controller/user");

router.post("/signup", signup);

router.post("/signin", signin);

// security csurf
router.get("/cs", (req, res) => {
  const csrf = req.csrfToken();

  console.log(csrf);
  // res.cookie("csrfcmrc", csrf);
  res.status(200).json({ success: true, csrfToken: csrf });
});

module.exports = router;
