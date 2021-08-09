// Package
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: "Email is required",
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Invalid Email format",
    ],
  },
  password: {
    type: String,
    required: "Password is required",
    select: false,
  },
});

// Middlewares
// Hash password before saving to database
userSchema.pre("save", async function (next) {
  // Check if there was a modification in the password field to avoid unecessary hashing
  if (!this.isModified("password")) {
    next();
  }

  // Hash password
  const saltRounds = parseInt(process.env.SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// Helper function to compare input and database stored password
userSchema.methods.comparePassword = async function (inputPassword) {
  bcrypt.compare(inputPassword, this.password, async function (err, result) {
    return result;
  });
};

// Helper function to generate a signed JWT for the current/this user
userSchema.methods.generateSignedToken = async function () {
  const privateKey = process.env.JWT_KEY;
  const expireTime = process.env.JWT_EXPIRATION;
  const token = await jwt.sign({ id: this._id }, privateKey, {
    expiresIn: expireTime,
  });

  return token;
};

// Save Schema
mongoose.model("User", userSchema);
