require("dotenv").config();

// Packages
const express = require("express");
const cors = require("cors");
const eJWT = require("express-jwt");
const cookieParser = require("cookie-parser");

// Init
const app = express();
const PORT = process.env.PORT;

// Database
require("./config/database");

// Middlewares
app.use(express.json());
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH");
  next();
});

// Route Middleware
app.use("/", require("./routes/index"));
app.use("/user", require("./routes/user"));
app.use("/test", require("./routes/test"));

// Listener
app.listen(PORT, () =>
  console.log(
    `Server runinng and listening to port ${PORT}. http://localhost:${PORT}/`
  )
);
