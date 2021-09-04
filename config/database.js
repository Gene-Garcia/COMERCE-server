require("dotenv").config();

// Packages
const mongoose = require("mongoose");

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@personal-cluster.sofzm.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

/* Asyncly connect to database to stop the app to create requests to an unconnected database */
(async () => {
  try {
    await mongoose
      .connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(
        () => {
          console.info(`Connected to database`);
        },
        (error) => {
          console.error(`Connection error: ${error.stack}`);
        }
      );
  } catch (error) {
    console.log("error");
    console.log(error);
  }
})();

/* Responsible to fix any deprecation warning of Mongoose raised in the terminal */
mongoose.set("useCreateIndex", true);

// Initiate Models
require("../models/userModel");
require("../models/inventoryModel");
require("../models/productModel");
require("../models/cartModel");
