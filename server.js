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

// Routing
app.use("/", require("./routes/index"));

// Listener
app.listen(PORT, () =>
  console.log(
    `Server runinng and listening to port ${PORT}. http://localhost:${PORT}/`
  )
);
