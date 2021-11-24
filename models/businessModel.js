/*
 * The business model-schema is somehow like a seperate entity which is created
 * when a SELLER user registers.
 *
 * This model holds the reference to the user model-schema.
 * The reason being,
 *      Not all user will be a SELLER.
 *      But, a SELLER can be a CUSTOMER (i.e., have a cart, orders, etc.)
 *
 * If the user model-schema were to hold the reference to business model-schema, then,
 * every user record either have a reference to this or not.
 *
 * For example, a CUSTOMER user will have a property that supposedly references to
 * business will forever have that property empty.
 * Unlike, a SELLER user will also have a cart property which is just a preparation
 * whenever the seller will order products.
 */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const businessSchema = Schema({
  _owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: "Business owner is required",
  },

  businessName: {
    type: String,
    required: "Name of business is required",
  },

  established: {
    type: Date,
    required: "Date when the business was established is required",
  },

  tagline: { type: String },

  businessLogoAddress: {
    type: String,
  },

  dateCreated: {
    type: Date,
    required: true,
  },
});

mongoose.model("Business", businessSchema);
