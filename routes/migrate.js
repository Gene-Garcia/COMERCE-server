/*
 * A route dedicated to hold logic for migrations or update
 * purposes.
 */

// packages
const router = require("express").Router();

// models
const User = require("mongoose").model("User");

// middleware

// controllers

// route
router.patch("/addUserType", async function (req, res) {
  // updates all existing user data to have a userType with a value of CUSTOMEr
  await User.updateMany(
    {},
    { $set: { userType: "CUSTOMER" } },
    { upsert: true }
  )
    .then((result, err) => {
      if (err) res.status(500).json({ error: err.error });
      else res.status(200).json({ result });
    })
    .catch((err) => res.status(500).json({ error: err.error }));
});

module.exports = router;
