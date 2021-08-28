require("dotenv").config();

// Packages
const express = require("express");
const cors = require("cors");
const eJWT = require("express-jwt");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");

// Init
const app = express();
const PORT = process.env.PORT;

// Database
require("./config/database");

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(csrf({ cookie: true }));
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", "https://co-merce.netlify.app"],
  })
);
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://co-merce.netlify.app",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // res.setHeader("Access-Control-Allow-Credentials", true);
  // res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH");
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
