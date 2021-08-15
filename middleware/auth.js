// AUTHENTICATION & AUTHORIZATION

// Packages
const jwt = require("jsonwebtoken");

// Model
const User = require("mongoose").model("User");

// Protector Function to route
// this middleware function will be placed in the request method before the controller
// hence, at the bottom, we have next() which indicate to proceed to performn the controller. note that it takes no parameters
// any error will be sent to req directly, or maybe create your own customer error handler and use next(error) which will handle the response for error
exports.authorize = async (req, res, next) => {
  // use of LocalStorage, the format is usually Authorization: 'Bearer: {token}'
  // req.headers.authorization

  // use of cookies, the format is token={token}
  // req.header.cookie

  // console.log("header " + req.headers.cookie);
  let rawCookieToken;
  if (!req.headers.cookie) {
    // means no cookies was sent
    return res
      .status(401)
      .json({ success: false, error: "Unathorized access" });
  }
  // there was cookie, so split it
  rawCookieToken = req.headers.cookie.split(";")[0];

  // console.log("rawCookieToken " + rawCookieToken);
  let token;
  if (!rawCookieToken) {
    return res
      .status(401)
      .json({ success: false, error: "Unathorized access" });
  }
  // the rawCookieToken is token={valueToken}
  token = rawCookieToken.split("=")[1];

  // console.log("token " + token);
  if (!token) {
    // if no token found raise an error response
    return res
      .status(401)
      .json({ success: false, error: "Unathorized access" });
  }

  // reaching here indicates that there is a token
  try {
    // decode the token to get the embedded data which is the id of the user
    const decode = jwt.verify(token, process.env.JWT_KEY);
    const userId = decode.id;

    // find user record
    const user = await User.findById(userId).exec();

    if (user === null || user === undefined)
      return res.status(404).json({ success: false, error: "User not found" });

    // assigned the user to the request
    // then allow express to proceed to the controller of the route
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
};
