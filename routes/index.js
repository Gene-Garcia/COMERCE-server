const router = require("express").Router();

const { signin, signup } = require("../controller/user");

router.post("/signup", signup);

router.post("/signin", signin);

module.exports = router;
