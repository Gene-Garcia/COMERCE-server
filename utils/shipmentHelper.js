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
