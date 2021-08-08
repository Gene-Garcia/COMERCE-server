// Models
const User = require("mongoose").model("User");

exports.signin = (req, res, next) => {
  res.send("sign in");
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
