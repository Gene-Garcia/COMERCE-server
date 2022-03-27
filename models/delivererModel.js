const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const delivererSchema = Schema({
  _user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    // do not make it required so that we will be able to save the record first
    // and check if it was a success. Only then will we save the user and reference it again
    // required: "No user record was referenced",
  },

  firstName: {
    type: String,
    required: "First name is required",
  },

  lastName: {
    type: String,
    required: "Last name is required",
  },

  contactInformation: {
    streetAddress: {
      type: String,
    },

    barangay: {
      type: String,
      required: "Barangay is required",
    },

    cityMunicipality: {
      type: String,
      required: "City or municipality is required",
    },

    province: {
      type: String,
      required: "Province is required",
    },

    primaryNumber: {
      type: String,
      required: "Primary number is required",
      match: [/^9\d{9}$/, "Invalid primary phone number"],
    },

    secondaryNumber: {
      type: String,
      match: [/^9\d{9}$/, "Invalid primary phone number"],
    },
  },

  vehicleInformation: {
    maker: {
      type: String,
      required: "Car maker is required",
    },

    plateNumber: {
      type: String,
      required: "Plate number is required",
      match: [/^\d{3}[A-Z]{4}$/, "Invalid plate number"],
    },

    classification: {
      type: String,
      required: "Car classification is required",
    },

    registeredOwner: {
      type: String,
      required: "Registered owner is required",
    },

    fuel: {
      type: String,
      required: "Car fuel type is required",
    },

    engineCapacity: {
      type: Number,
      required: "Car engine capacity in cubic centimeters is required",
      min: [150, "150 is the minimum recognized engine capacity"],
      max: [7000, "7000 is the maximum recognized engine capacity"],
    },

    transmission: {
      type: String,
      required: "Car transmission type is required",
    },
  },
});

// save to mongoose
mongoose.model("Deliverer", delivererSchema);
