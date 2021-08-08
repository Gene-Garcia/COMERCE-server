// Package
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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
  bcrypt.compare(
    inputPassword,
    this.password,
    await function (err, result) {
      if (err) next(err);
      else return result;
    }
  );
};

// Save Schema
mongoose.model("User", userSchema);
