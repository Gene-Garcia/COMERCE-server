// Packages
require("dotenv").config();
const jwt = require("jsonwebtoken");

// Model
const User = require("mongoose").model("User");

/*
 * A middlware function that will authorize a request using the JWT which is found in request headers.
 * The request header JWT is passed by the server on login
 *
 * This function decodes the JWT, which contains the user id.
 * The id then will be used to find the user in the database.
 *
 * Instances when:
 *     No JWT was found in the request
 *     The found token, when decoded, does not constitutes to any user id in the database
 * will result to http status code of 401, and 404.
 *
 * A successful authorization will lead to setting the 'user' variable in the request format.
 * The next() will now then proceed to the 'controller' set. Example, router.METHOD(authorize, 'controller').
 * Otherwise, just sends the response.
 */
exports.authorize = async (req, res, next) => {
  const token = req.cookies[process.env.JWT_KEY_IDENTIFIER];
  if (!token) {
    // No JWT token was found in the headers or in the request origin's cookies
    return res
      .status(401)
      .json({ success: false, error: "Unathorized access" });
  }

  try {
    // Decode the token to get the embedded data which is the id of the user
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const userId = decoded.id;

    // Find user in the database
    const user = await User.findById(userId).exec();

    // The user id decoded from the JWT does not constitute to any user in the database
    if (user === null || user === undefined)
      return res.status(404).json({ success: false, error: "User not found" });

    // Set the user to the request.user
    // Then, allow express to proceed to the controller of the route
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
};
