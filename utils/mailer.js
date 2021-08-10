// SendGrid Web API

// Package
require("dotenv").config();
const mailer = require("@sendgrid/mail");

exports.sendMailer = async (message) => {
  // Format
  /*
    to: 'test@example.com', // Change to your recipient
    from: 'test@example.com', // Change to your verified sender
    subject: 'Sending with SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    */

  // Configuration
  mailer.setApiKey(process.env.SENDGRID_API_KEY);

  try {
    const result = await mailer.send(message);
    // console.log(result);
    return result;
  } catch (error) {
    // console.log(error);
    return error.message;
  }
};
