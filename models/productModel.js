// packages
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = Schema({
  _owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  imageAddress: {
    type: String,
  },

  item: {
    type: String,
    required: "Item name is required.",
  },

  wholesaleCap: {
    type: Number,
    required: "Wholesale Requirement Cap is required",
  },

  wholesalePrice: {
    type: Number,
    required: "Wholesale price is required",
  },

  retailPrice: {
    type: Number,
    required: "Retail price is required",
  },

  description: String,

  rating: [
    {
      type: Number,
      min: 0,
    },
  ],

  _inventory: [
    {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
    },
  ],
});

// Save
mongoose.model("Product", productSchema);
