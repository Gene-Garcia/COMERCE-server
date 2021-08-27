require("dotenv").config();

// Packages
const mongoose = require("mongoose");

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@personal-cluster.sofzm.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
console.log(uri);

// Connect, async
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

mongoose.set("useCreateIndex", true);

// Initiate Models
require("../models/userModel");
require("../models/inventoryModel");
require("../models/productModel");
require("../models/cartModel");
