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
 * Validates and checks whether the personal address of the deliverer
 * object contains all neccessary fields.
 * */
exports.validateDelivererAddress = (address) => {
  const { streetAddress, barangay, cityMunicipality, province } = address;

  if (!streetAddress || !barangay || !cityMunicipality || !province)
    return false;

  return true;
};
