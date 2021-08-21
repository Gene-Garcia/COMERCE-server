// packages
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const inventorySchema = Schema({
  dateStored: Date,

  quantity: {
    type: Number,
    required: "Total quantiy is required",
  },

  onHand: {
    type: Number,
    require: "Quantity on-hand is required",
    min: 0,
  },
});

// Save
mongoose.model("Inventory", inventorySchema);
