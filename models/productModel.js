// packages
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = Schema({
  _business: {
    type: Schema.Types.ObjectId,
    ref: "Business",
    required: "The product must be assigned to a business",
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

  brand: {
    type: String,
    required: "Brand name is required",
  },

  keywords: [
    {
      type: String,
    },
  ],

  category: {
    type: String,
    required: "Category is required",
  },

  description: {
    type: String,
    required: "Description is required",
  },

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
