// Models
const User = require("mongoose").model("User");

// Utilis
const { sendMailer } = require("../utils/mailer");

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
      const credentials = await user.comparePassword(password);
      console.log(credentials);
      if (credentials) {
        const token = await user.generateSignedToken();

        // remove password field from object
        // delete user.password;

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

exports.postForgotPassword = async (req, res, next) => {
  const { email } = req.body;

  // we must use the await to access the embed middleware function
  try {
    let user = await User.findOne({ email }).exec();

    if (user === null || user === undefined)
      res
        .status(404)
        .json({ success: false, error: "Emaill cannot be found." });
    else {
      try {
        // generate the password
        user.generateResetPasswordToken();
        await user.save();

        // send email
        const resetLink =
          "https://comerce.netlify.app/reset/" + user.resetPasswordToken;

        const emailMsg = {
          to: user.email, // Change to your recipient
          from: process.env.MAILER_OWNER, // Change to your verified sender
          subject: "Forgot Password Account Request",
          text: `Go here ${resetLink} to reset your password`,
          html: `
        <h1>Password reset</h1>
        <p>This link will expire within 15 minutes.</p>
        <a href=${resetLink}>Click here to reset your password</a>
        <p>Token: ${user.resetPasswordtoken}</p>
        <br />
        <p>Thanks,</p>
        <p>CoMerce team<p/>`,
        };

        await sendMailer(emailMsg);

        res
          .status(200)
          .json({ success: true, message: "An email has been sent." });
      } catch (error) {
        // remove the set token in database
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpiration = undefined;
        await user.save();

        res.status(500).send({
          success: false,
          error: "Email cannot be send successfully",
        });
      }
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

exports.putResetPassword = async (req, res, next) => {
  const { password, email, resetPasswordToken } = req.body;

  try {
    const user = await User.findOne({
      email,
      resetPasswordToken,
      resetPasswordTokenExpiration: { $gt: Date.now() },
    }).exec();

    if (user === null || user === undefined)
      res.status(404).json({
        success: false,
        error: "Invalid rest password request or reset password token",
      });

    // update the password, which will trigger the embedded method
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiration = undefined;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }

  res.send("reset");
};
