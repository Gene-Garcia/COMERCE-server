/*
 * Helper function that validates and checks whether passed object
 * has all the expected value for vehicle registration/data
 */
exports.validateVehicleData = (vehicleData) => {
  const {
    maker,
    plateNumber,
    classification,
    registeredOwner,
    fuel,
    engineCapacity,
    transmission,
  } = vehicleData;

  if (
    !maker ||
    !plateNumber ||
    !classification ||
    !registeredOwner ||
    !fuel ||
    !engineCapacity ||
    !transmission
  )
    return false;

  return true;
};

/*
 * Validates and checks whether the personal information of the deliverer
 * object contains all neccessary fields.
 *
 * The checks also validates the nested object "contactInformation"
 */
exports.validateDelivererData = (delivererData) => {
  const {
    contactInformation: {
      streetAddress,
      barangay,
      cityMunicipality,
      province,
      primaryNumber,
      //secondaryNumber, //not required
    },
    firstName,
    lastName,
  } = delivererData;

  if (
    !firstName ||
    !lastName ||
    !streetAddress ||
    !barangay ||
    !cityMunicipality ||
    !province ||
    !primaryNumber
  )
    return false;

  return true;
};
