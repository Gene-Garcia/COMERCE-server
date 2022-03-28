// Packages
require("dotenv").config();

// Models
const User = require("mongoose").model("User");
const Business = require("mongoose").model("Business");
const Deliverer = require("mongoose").model("Deliverer");

// Utils
const { sendMailer } = require("../utils/mailer");

// Custom Error Message
const { error } = require("../config/errorMessages");
const { validateBusinessData } = require("../utils/businessHelper");
const {
  validateVehicleData,
  validateDelivererData,
} = require("../utils/delivererHelper");

/*
 * POST Method
 *
 * Credentials expected are email and password.
 *
 * Second key function of this function is:
 *    generating JWT
 *    setting JWT to an http only cookie
 *
 * With that, the cookie with the JWT cannot be accessed in the client.
 * It will only be send every request made to the server and
 * will be used by the authorize middleware whenever embedded to a route.
 *
 * We have now implemented different types of user (SELLER, CUSTOMER).
 * The logic in this would be able to retrieve any USER record regarless of the userType
 *
 * Now using the new paramter, expectedUserType. It will filter the found user record to
 * determine if that record is appropriate for our request. There are 2 possible request to be made
 * here by the client (/login/user and /login/seller). The former needs user records that are CUSTOMER, while
 * the latter wants user records that are SELLER.
 *
 */
exports.signin = async (req, res, next) => {
  const { email, password, expectedUserType } = req.body;

  try {
    const user = await User.findOne(
      { email: email },
      "+password email username _id userType"
    ).exec();

    if (!user || !expectedUserType)
      res.status(406).json({ error: error.invalidCredentials });
    else if (user.userType !== expectedUserType)
      res.status(401).json({ error: error.unathorizedAccess });
    else {
      const credentials = await user.comparePassword(password);
      if (credentials) {
        const jwt = await user.generateSignedToken();

        // set cookie
        // the JWT expiration is 15 minutes in 'ms'
        res.cookie(process.env.JWT_KEY_IDENTIFIER, jwt, {
          httpOnly: true,
          maxAge: process.env.JWT_EXPIRATION,
        });

        // Sign up for SELLER
        if (expectedUserType === "SELLER") {
          // query the business information and return the user and business info

          const business = await Business.findOne(
            { _owner: user._id },
            "businessEmail businessName businessLogoAddress"
          );

          return res.status(200).json({
            user,
            business,
            token: jwt,
          });
        }

        // Sign up for LOGISTICS
        if (expectedUserType === "LOGISTICS") {
          // validate if this user has a deliverer record
          const isRegistered = await Deliverer.exists({ _user: user._id });

          if (!isRegistered)
            return res
              .status(404)
              .json({ error: error.logisticsAccountNotFound });
        }

        // Custome user sign up
        // user is not SELLER
        return res.status(200).json({
          user,
          token: jwt,
        });
      } else res.status(404).json({ error: error.invalidCredentials });
    }
  } catch (e) {
    res.status(500).json({ error: error.serverError });
  }
};

/*
 * POST Method
 *
 * This function only creates a new record of the user, it does not authenticate
 * nor authorize the user. The client still needs to login using their new account
 *
 * additionally, if the userType is a SELLER it will include additional steps
 * singing up as a seller will create a business record.
 * The new business record will then reference to the newly created user account.
 *
 * whenever the creation of the business account faill, will result to the deletion
 * of the newly created user account.
 *
 */
exports.signup = async (req, res, next) => {
  const { email, username, password, userType } = req.body;

  // SELLER account sign up
  const { businessData } = req.body;

  // LOGISTICS account sign up
  const { vehicleData, delivererData } = req.body;

  if (!email || !username || !password || !userType)
    res.status(406).json({ error: error.incompleteData });
  else {
    try {
      // check if existing
      const check = await User.findOne({ email }, "_id").exec();

      if (check) res.status(500).json({ error: error.emailTaken });
      else {
        const newUser = User({
          email,
          username,
          password,
          userType,
        });

        // USER SAVE SHOULD OCCUR CREATING THE BUSINESS/LOGISTICS ACCOUNT
        // AND ENSURE TO DELETE THE CREATED USER RECORD WHENEVER SAVE OF
        // BUSINESS/LOGISTICS RECORD FAILS

        if (userType === "SELLER") {
          // a SELLER signup will lead to creation of the business account
          if (validateBusinessData(businessData)) {
            // we need to wrap the creation of the business account
            // in order to catch error raised by mongoose and delete the created account

            await newUser.save();

            const businessRec = await Business.create({
              _owner: newUser._id,
              dateCreated: new Date(),
              ...businessData,
            });

            if (!businessRec) {
              return res.status(500).json({
                error: error.sellerError,
              });
            } else {
              await newUser.save();
              res.status(200).json({});
            }
            // delete also the account record here
          } else res.status(406).json({ error: error.incompleteData });
        } else if (userType === "LOGISTICS") {
          // a LOGISTICS signup will lead to the creation of a deliverer record
          if (!validateVehicleData(vehicleData))
            return res.status(406).json({ error: error.incompleteData });

          if (!validateDelivererData(delivererData))
            return res.status(406).json({ error: error.incompleteData });

          // create Deliverer
          const deliverer = Deliverer();
          // deliverer._user = newUser._id;

          deliverer.firstName = delivererData.firstName;
          deliverer.lastName = delivererData.lastName;

          deliverer.contactInformation = {
            ...delivererData.contactInformation,
            primaryNumber: parseInt(
              delivererData.contactInformation.primaryNumber
            ),
            secondaryNumber: delivererData.contactInformation.secondaryNumber
              ? parseInt(delivererData.contactInformation.secondaryNumber)
              : null,
          };

          deliverer.vehicleInformation = { ...vehicleData };

          // save Deliverer
          await deliverer.save();

          let success = await Deliverer.exists({ _id: deliverer._id });

          // failed
          if (!success) {
            // do not create user record

            return res.status(505).json({ error: error.delivererError });
          }

          // success
          // save new user and reference to deliverer
          await newUser.save();
          success = await User.exists({ _id: newUser._id });

          // failed
          if (!success) {
            // delete the deliverer
            await Deliverer.deleteOne({ _id: deliverer._id }).exec();

            return res.status(505).json({ error: error.delivererError });
          }

          // reference to deliverer and save
          deliverer._user = newUser._id;
          await deliverer.save();

          return res.status(201).json({});
        } else {
          // The logic, after registration, go back to login, so no need, yet, to send token
          await newUser.save();
          res.status(200).json({});
        }
      }
    } catch (e) {
      console.log(e.message);
      res.status(500).json({ error: error.serverError });
    }
  }
};

/*
 * POST Method
 *
 * This function only clears the cookie record of the JWT and
 * set its expiration/mag age date to an expired date, which is the current time.
 *
 */
exports.signout = async (req, res, next) => {
  try {
    res.cookie(process.env.JWT_KEY_IDENTIFIER, "", {
      httpOnly: true,
      maxAge: Date.now(),
    });
    res.status(200).json({});
  } catch (error) {
    res.status(500).json({ error: error.serverError });
  }
};

/*
 * POST Method
 *
 * This function expects to receieve an email where the reset link with token will be sent.
 * However, it will still validate if the email is in the database.
 *
 */
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) res.status(406).json({ error: error.incompleteData });

  // we must use the await to access the embed middleware function
  try {
    let user = await User.findOne(
      { email },
      "email resetPasswordToken resetPasswordTokenExpiration"
    ).exec();

    if (!user)
      res.status(404).json({ success: false, error: "Email cannot be found." });
    else {
      try {
        // generate the password token and expiration
        user.generateResetPasswordToken();
        await user.save();

        // programatically determine if the runntime is in development or deployed
        const domain = process.env.PRODUCTION
          ? "https://co-merce.netlify.app"
          : "http://localhost:3000";

        // send email
        const resetLink = `${domain}/password/reset?token=${user.resetPasswordToken}`;
        const emailMsg = {
          to: user.email,
          from: process.env.MAILER_OWNER,
          subject: "Forgot Password Account Request",
          text: `Go here ${resetLink} to reset your password`,
          html: `
        <h1>Password reset</h1>
        <p>This link will expire within 15 minutes.</p>
        <a href=${resetLink}>Click here to reset your password</a>
        <br />
        <p>Thanks,</p>
        <p>COMERCE team<p/>`,
        };
        await sendMailer(emailMsg);

        res.status(200).json({
          message: `An email has been sent to ${email}. Please follow the instruction in the email to have your password resetted. Thank you!`,
        });
      } catch (error) {
        // remove the set token in the users record in the database
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpiration = undefined;
        await user.save();

        res.status(500).send({
          error:
            "Our server have encountered an error in sending an email. Try again. If error persists please contact our customer support.",
        });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: error.serverError });
  }
};

/*
 * PUT Method
 *
 * The function handles the actual reset password, where the user have given
 * their new password and will be hashed and PUT/UPDATED to their account record.
 *
 * This function expects and requires a correct reset password token which is embedded
 * in the set email.
 *
 */
exports.resetPassword = async (req, res, next) => {
  const { password, email, resetPasswordToken } = req.body;

  if (!password || !email || !resetPasswordToken)
    res.status(406).json({ error: error.incompleteData });

  try {
    const user = await User.findOne(
      {
        email,
        resetPasswordToken,
        resetPasswordTokenExpiration: { $gt: Date.now() },
      },
      "+password resetPasswordToken resetPasswordTokenExpiration"
    ).exec();

    if (!user) res.status(404).json({ error: error.invalidResetPasswordToken });

    // update the password, which will trigger the embedded method
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiration = undefined;
    await user.save();

    res
      .status(201)
      .json({ message: "Your password was changed successfully." });
  } catch (e) {
    res.status(500).json({ error: error.serverError });
  }
};

/*
 * POST Method, but maybe we can chage it to patch or put because it only updates the user's password
 *
 * This function is used to reset a password where the user still remembers their current password.
 *
 * A notable code in this function is that it still needs to re-query the user even when
 * there is a req.user.
 * That is because req.user does not contain the 'password' field, hence, we cannot use the comparePassword
 * function.
 *
 */
exports.changePassword = async (req, res, next) => {
  const { newPassword, oldPassword } = req.body;
  email = req.user.email;

  if (!newPassword || !oldPassword || !email)
    res.status(406).json({ error: error.incompleteData });

  try {
    // req.user does not have the password field, hence, we cannot use comparePassword. We need to re-query the user
    const user = await User.findById(req.user._id, "_id +password").exec();

    if (!user) res.status(404).json({ error: error.userNotFound });
    else {
      // we can now use compare password
      const matchOldPassword = await user.comparePassword(oldPassword);

      if (!matchOldPassword)
        res.status(404).json({ error: error.incorrectOldPassword });
      else {
        // change and save the password in db
        user.password = newPassword;
        await user.save();

        res
          .status(200)
          .json({ message: "Your password was changed successfully." });
      }
    }
  } catch (e) {
    res.status(500).json({ error: error.serverError });
  }
};

/*
 * GET Method
 *
 * This function was used only during development. There is still no seen use for this function.
 *
 */
exports.index = async (req, res, next) => {
  res.status(200).json({ message: "Welcome " + req.user.username });
};

/*
 * GET Method
 *
 * This is a function that is intended to be called in client views/pages that requires to
 * have a user logged in, but does not do server/API requests. This includes the landing of the user
 *
 * Hence, this function will be used by those views to create a request to this function and
 * validate if the JWT is present and is valid before having the user view that client view/page.
 *
 */
exports.userValidator = async (req, res, next) => {
  res.status(200).json({
    authorized: true,
    message: "This user is authorized",
  });
};
