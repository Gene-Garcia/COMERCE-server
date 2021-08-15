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

  // checks if there is proper header with the 'Bearer' keyword. Bearer of jason web token
  let token;
  const rawCookieToken = req.headers.cookie.split(";")[0];
  if (
    req.headers.cookie &&
    rawCookieToken &&
    rawCookieToken.startsWith("token")
  ) {
    // if there is header for authorization that contains 'Bearer'
    token = rawCookieToken.split("=")[1]; // 0 is bearer, 1 is the token
  }

  // if no token found raise an error response
  if (!token) {
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
