/*
 * validates and populates the shipment details sent by the client.
 * returns the object with exact data needed, false if incomplete, empty, or invalid.
 */
function populateShipmentDetails(data) {
  const {
    firstName,
    lastName,
    cellphoneNumber,
    streetAddress,
    province,
    cityMunicipality,
    barangay,
    additionalNotes,
  } = data;

  if (
    !firstName ||
    !lastName ||
    !cellphoneNumber ||
    !streetAddress ||
    !province ||
    !cityMunicipality ||
    !barangay ||
    !additionalNotes
  )
    return false;
  else
    return {
      firstName,
      lastName,
      cellphoneNumber,
      streetAddress,
      province,
      cityMunicipality,
      barangay,
      additionalNotes,
    };
}

module.exports = populateShipmentDetails;
