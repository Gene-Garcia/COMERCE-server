// Models
const User = require("mongoose").model("User");

exports.signin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email }, "+password").exec();

    if (user === null || user === undefined)
      res.status(404).send({
        success: false,
        error: "Invalid Credentials",
      });
    else {
      if (user.comparePassword(password)) {
        // remove password field from object
        delete user.password;

        res.status(200).send({ success: true, user });
      } else
        res.status(404).send({
          success: false,
          error: "Invalid credentials",
        });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

exports.signup = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const newUser = await User.create({ email, password });

    res.status(200).send({
      success: true,
      user: newUser,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error: error.message,
    });
  }
};
