const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = Schema({
  _product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },

  quantity: {
    type: Number,
    required: "Quantity is required",
    min: 0,
  },

  dateAdded: {
    type: Date,
    required: "Date is required",
  },
});

// save to mongoose
mongoose.model("Cart", cartSchema);
