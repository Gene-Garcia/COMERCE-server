// Package
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = mongoose.Schema({
  userType: {
    type: String,
    required: "User type is required",
  },

  email: {
    type: String,
    required: "Email is required",
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Invalid Email format",
    ],
  },

  username: {
    type: String,
  },

  password: {
    type: String,
    required: "Password is required",
    select: false,
  },

  resetPasswordToken: {
    type: String,
  },

  resetPasswordTokenExpiration: {
    type: Date,
  },

  _cart: [
    {
      type: Schema.Types.ObjectId,
      ref: "Cart",
    },
  ],

  fullName: {
    firstName: {
      type: String,
    },

    lastName: {
      type: String,
    },
  },

  /*
   * will be set up later
   * 
   * So for a seller this is not considered as their
   * business and pick-up address
   */
  shippingAddress: {
    street: {
      type: String,
    },
    barangay: {
      type: String,
    },
    townMunicipality: {
      type: String,
    },
    province: {
      type: String,
    },
  },

  contactDetails: {
    phoneNumber: {
      type: Number,
      match: [/^9\d{9}$/, "Invalid primary phone number"],
    },
    secondaryNumber: {
      type: Number,
      match: [/^9\d{9}$/, "Invalid primary phone number"],
    },
  },
});

/*
 * Plugin Function to 'User'
 *
 * The parameter 'save' indicates that this function will automatically be
 * triggered to hash password before saving to database.
 *
 * The plugin also first checks if the save event included the change of password.
 * This allows the app to not rehash the password unecessarily; saves resources.
 *
 */
userSchema.pre("save", async function (next) {
  // Check if there was a modification in the password field to avoid unecessary hashing
  if (!this.isModified("password")) {
    next();
  }

  // Hash password
  const saltRounds = parseInt(process.env.SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, saltRounds);
});

/*
 * Plugin Function to 'User'
 *
 * This function can be called by a user instance, not by a document which is accessed
 * through callback execute query of mongoose. That is, we must use 'const user = await User.find(...).exec()'
 *
 * This is a necessary function because the stored password is hashed, hence, we cannot
 * easily compare unhashed text with a hashed text.
 * We now rely with bcrypt's built-in compare function.
 */
userSchema.methods.comparePassword = async function (inputPassword) {
  const result = await bcrypt.compare(inputPassword, this.password);
  return result;
};

/*
 * Plugin Function to 'User'
 *
 * This plugin function is used when a user logs in. It returns the valid
 * encoded JWT which has the user's id
 *
 */
userSchema.methods.generateSignedToken = async function () {
  const privateKey = process.env.JWT_KEY;
  const expireTime = process.env.JWT_EXPIRATION;

  const token = await jwt.sign(
    { id: this._id, userType: this.userType },
    privateKey,
    {
      expiresIn: expireTime,
    }
  );

  return token;
};

/*
 * Plugin Function to 'User'
 *
 * This plugin function is responsible for generating the reset password token which
 * will be sent to the email.
 *
 * Note that the reset token is stored in the database, however, to enforce the expiration
 * and validity of the JWT, token expiration date-time is also stored in the database.
 * It will then be used to check and not only the reset token.
 *
 */
userSchema.methods.generateResetPasswordToken = async function () {
  const token = await crypto.randomBytes(48).toString("hex");

  // update to database
  this.resetPasswordToken = token;
  const date = new Date();
  date.setMinutes(date.getMinutes() + 15);
  this.resetPasswordTokenExpiration = date;
};

// Save Schema
mongoose.model("User", userSchema);
