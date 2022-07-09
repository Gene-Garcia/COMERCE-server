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
    required: true,
  },

  _order: {
    type: Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },

  _business: {
    type: Schema.Types.ObjectId,
    ref: "Business",
  },
  // or, if business then seller pick up, else customer then delivery
  _customer: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  orders: [
    {
      _order: {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },

      products: [
        {
          // _product
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
    },
  ],

  // seller pick up or customer delivery
  logisticsType: {
    type: String,
    required: "Logistics type is required",
  },

  // date when either product is picked up or when ordered products is out for delivery
  dateStarted: {
    type: Date,
    required: "Date started is required",
  },

  successAttempt: {
    proof: {
      // for now a key that is declared and recognizable only by the customer or the warehouse
      type: String,
    },
  },

  failedAttempts: [
    {
      // reason
      reason: {
        type: String,
      },

      // date
      attemptDate: {
        type: Date,
      },
    },
  ],
});

// save to mongoose
mongoose.model("Logistics", logisticsSchema);
