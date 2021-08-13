require("dotenv").config();

// Packages
const express = require("express");

// Init
const app = express();
const PORT = process.env.PORT;

// Database
require("./config/database");

// Middlewares
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
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
