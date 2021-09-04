require("dotenv").config();

// Packages
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");

// Init
const app = express();
const PORT = process.env.PORT;
/* A determiner variable that will help the server to know where the API requests will come from */
const isProduction = process.env.PRODUCTION || false;
conts = origin = isProduction
  ? "https://co-merce.netlify.app"
  : "http://localhost:3000";

// Database
require("./config/database");

// Middlewares
app.set("trust proxy", 1); // ref: https://stackoverflow.com/questions/66503751/cross-domain-session-cookie-express-api-on-heroku-react-app-on-netlify
app.use(express.json());
app.use(cookieParser());
/*
 * Applying this middleware sets cookie in res with the cookie, on the first request and updates it once the token expires,
 * token which will be use to verify every request (GET, POST, etc.) made to the server.
 */
app.use(csrf({ cookie: true }));
/*
 * Setting the credentials to true makes the server expect the use of cookies that holds secure token,
 * or any cookies for that matter.
 *
 * Setting the origin is crucial to further enforce security and the csrf.
 * The server will only handle requests made from the set origin, hence, any request made
 * by other sites (XSS or cross-site attacks) will not be handled and will not be given a CSRF token
 */
app.use(
  cors({
    credentials: true,
    origin: origin,
  })
);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

// Route Middleware
app.use("/api", require("./routes/index"));
app.use("/api/user", require("./routes/user"));
app.use("/api/product", require("./routes/product"));
app.use("/api/cart", require("./routes/cart"));
app.use("/test", require("./routes/test"));

// Listener
app.listen(PORT, () =>
  console.log(
    `Server runinng and listening to port ${PORT}. http://localhost:${PORT}/`
  )
);
