// Packages
const route = require("express").Router();

// Auth middleware
const { authorize } = require("../middleware/auth");

// Models
const User = require("mongoose").model("User");
const Product = require("mongoose").model("Product");
const Inventory = require("mongoose").model("Inventory");
const Order = require("mongoose").model("Order");
const Deliverer = require("mongoose").model("Deliverer");

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

route.patch("/callback/save", async (req, res) => {
  const product = "61b8522e29689f0708a82767";

  Product.findById(product, "item _inventory").exec(async (err, product) => {
    console.log(product);
    product.item = "Samsung A53 5G 2022";

    // // does not save in inventory reference
    // product._inventory[0].quantity = 500;

    // we can now perform async functions inside through callback/then
    const inventories = await Inventory.find({
      _id: { $in: product._inventory },
    }).exec();

    // we can save a document from a callback
    // await product.save();
    return res.status(200).json({ inventories, product });
  });
});

route.patch("/bulk", async (req, res) => {
  const one = Product();
  one._id = "61b8522e29689f0708a82767";
  one.item = "Samsung A53 5G 2022 UPDATED BULK";

  const two = Product();
  two._id = "61b8a980ebffe000ec6191cd";
  two.item = "iPhone 13 PRO 1TB UPDATED BULK";
  const products = [one, two];

  console.log(one);

  const result = await Product.bulkWrite([
    {
      updateOne: {
        filter: { _id: one._id },
        update: { item: one.item },
        upsert: false,
      },
    },
    {
      updateOne: {
        filter: { _id: two._id },
        update: { item: two.item },
        upsert: false,
      },
    },
  ]);

  res.status(200).json({ result });
});

route.get("/embedded", async (req, res) => {
  /*
   * the orderedProducts.status : PLACED does work
   * however its just that the other array objects contains different status
   * So mongoose selects the entire order that has ANY orderedProducts.status of PLACED
   * and will include the other object in that array
   */
  const orders = await Order.find(
    {
      status: "LOGISTICS",
      "orderedProducts.status": "PLACED",
    },
    "orderedProducts status"
  ).exec();

  return res.status(200).json({ orders });
});

route.get("/deliverer", async (req, res) => {
  const d = Deliverer();

  d.firstName = "John";
  d.lastName = "Doe";
  d.contactInformation.streetAddress = "l1 b14 jade st juana 1";
  d.contactInformation.barangay = "san francisco";
  d.contactInformation.cityMunicipality = "binan";
  d.contactInformation.province = "laguna";
  d.contactInformation.primaryNumber = "09053660668";
  d.contactInformation.secondaryNumber = "09053660668";
  d.vehicleInformation.maker = "Honda";
  d.vehicleInformation.plateNumber = "531ssCD";
  d.vehicleInformation.classification = "Type 1";
  d.vehicleInformation.registeredOwner = "Name of Owner";
  d.vehicleInformation.fuel = "Gasoline";
  d.vehicleInformation.engineCapacity = 1000;
  d.vehicleInformation.transmission = "Manual";

  console.log(d);

  const result = await d.save();

  console.log(result);
  res.status(200).json({ d, result });
});

module.exports = route;
