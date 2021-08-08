require("dotenv").config();

// Packages
const mongoose = require("mongoose");

// Connect
mongoose.connect(`${process.env.DB_URI}/${process.env.DB_NAME}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.set("useCreateIndex", true);

// Initiate Models
require("../models/userModel");
