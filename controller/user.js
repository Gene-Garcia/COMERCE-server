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
        const token = await user.generateSignedToken();

        // remove password field from object
        delete user.password;

        res.status(200).json({
          success: true,
          user: { id: user._id, email: user.email },
          token,
        });
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

    // The logic, after registration, go back to login, so no need, yet, to send token
    res.status(200).send({
      success: true,
      user: { id: newUser._id, email: newUser.email },
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error: error.message,
    });
  }
};
