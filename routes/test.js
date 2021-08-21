// Packages
const route = require("express").Router();

// Auth middleware
const { authorize } = require("../middleware/auth");

// Models
const User = require("mongoose").model("User");
const Product = require("mongoose").model("Product");
const Inventory = require("mongoose").model("Inventory");

// controller

// utils
const { sendMailer } = require("../utils/mailer");

// Routes
route.get("/private", authorize, (req, res, next) => {
  res.send("Authorize");
});

route.get("/mail", async function (req, res) {
  const msg = {
    to: "gjgarcia@live.mcl.edu.ph", // Change to your recipient
    from: "genejogarcia.gg@gmail.com", // Change to your verified sender
    subject: "Sending with SendGrid is Fun",
    text: "and easy to do anywhere, even with Node.js",
    html: "<strong>and easy to do anywhere, even with Node.js</strong>",
  };

  const result = await sendMailer(msg);
  console.log("test.js " + result);
  res.json(result);
});

route.get("/piv", async (req, res) => {
  const id = "61160c87fa04b00e34cbcfaa";

  const product = await Product.find().exec();
  console.log(product);

  console.log("------------------");

  const product1 = await Product.find()
    .populate("_owner")
    .populate("_inventory")
    .exec();
  console.log(product1);
  const inv = product._inventory;

  console.log(inv);
  console.log(inv[0]);

  res.json(product1);
});

route.get("/pi", async (req, res) => {
  const id = "61160c87fa04b00e34cbcfaa";

  try {
    const user = await User.findById(id).exec();

    if (!user) res.status(404).json({ err: "User not found" });

    //create product
    let product = Product({
      _owner: user._id,
      item: "Water Bottle",
      description: "Quench your thirst with our premium and quality bottle",
      wholesaleCap: 15,
      wholesalePrice: 69.99,
      retailPrice: 98,
    });
    await product.save();

    // create inventory record
    const inventory = Inventory({
      dateStored: Date.now(),
      quantity: 30,
      onHand: 30,
    });
    await inventory.save();

    // reference save
    product._inventory.push(inventory);
    await product.save();

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json(error.message);
  }
});

module.exports = route;
