// package
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
 * This logistics model will contain both data for products that will be picked up
 * to be delivered to the warehouse, and delivering complete orders in the warehouse
 * to the customer.
 *
 * Seller pick ups - pick ups only selected products of an order because customer orders
 * can come from different seller
 *
 * Customer delivery - orders can only be delivered when all ordered products of an order
 * is present in the warehouse
 */

const logisticsSchema = Schema({
  _deliverer: {
    type: Schema.Types.ObjectId,
    ref: "Deliverer",
  },

  _product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },

  _order: {
    type: Schema.Types.ObjectId,
    ref: "Order",
  },

  deliveryType: {
    type: String,
    required: "Delivery type is required",
  },

  // date when either product is picked up or when ordered products is out for delivery
  dateStarted: {
    type: Date,
    required: "Date started is required",
  },

  // date when either product is delivered to warehouse or when ordered products received by the customer
  dateEnded: {
    type: Date,
    // not required because date ended will only be added after a succesfully pick up delivery or customer delivery
  },

  // ADD FIELDS FOR PROOF OF DELIVERY and ON FAILED DELIVERIES
});

// save to mongoose
mongoose.model("Logistics", logisticsSchema);
