// Packages
const route = require("express").Router();

// Auth middleware
const { authorize } = require("../middleware/auth");

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

module.exports = route;
