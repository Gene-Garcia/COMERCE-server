// package
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = Schema({
  _customer: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  paymentMethod: {
    type: String,
    required: "Payment method is required",
  },

  paymentInformation: {
    type: Object,
    required: "Payment information is required",
  },

  orderDate: {
    type: Date,
    required: "Order date is required",
  },

  ETADate: {
    type: Date,
    required: "ETA Date is required",
  },

  shipmentDetails: {
    type: Object,
    required: "Shipment details is required",
  },

  orderedProducts: [
    {
      quantity: {
        type: Number,
        required: "Quantity of an order is required",
        min: 1,
      },

      priceAtPoint: {
        type: Number,
        required: "Price of the product is required",
        min: 0,
      },

      _product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    },
  ],
});

// save to mongoose
mongoose.model("Order", orderSchema);