// package
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = Schema({
  _customer: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  orderDate: {
    type: Date,
    required: "Order date is required",
  },

  ETADate: {
    type: Date,
    required: "ETA Date is required",
  },

  status: {
    type: String,
    required: "Status of order is required",
    uppercase: true,
  },

  shippingFee: {
    type: Number,
    required: "Shipping fee is required",
    min: 0,
  },

  shipmentDetails: {
    type: Object,
    required: "Shipment details is required",
  },

  paymentMethod: {
    type: String,
    required: "Payment method is required",
  },

  paymentInformation: {
    type: Object,
    // required: "Payment information is required", not required because COD payment will have no other paymentInformation
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

      rated: {
        type: Boolean,
        default: false,
      },

      status: {
        type: String,
        required: "Product order status is required",
        uppercase: true,
      },

      _product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    },
  ],

  cancelled: {
    
  }
});

// save to mongoose
mongoose.model("Order", orderSchema);
