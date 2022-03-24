const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const delivererSchema = Schema({
  _user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  firstName: {
    type: String,
    required: "First name is required",
  },

  lastName: {
    type: String,
    required: "Last name is required",
  },

  contactInformation: [
    {
      type: Number,
      required: "Contact information is required",
    },
  ],

  vehicleInformation: {
    type: Object,
    required: "Vehicle information is required",
  },
});

// save to mongoose
mongoose.model("Deliverer", delivererSchema);
