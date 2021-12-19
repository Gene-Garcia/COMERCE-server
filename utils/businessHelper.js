/*
 * a helper function that will validate and check if the data
 * has all the necessary data expected by the program.
 *
 * returns false if invalid
 */
exports.validateBusinessData = (data) => {
  // logo, businessname, tagline, established
  const {
    businessName,
    tagline,
    established,
    businessLogoAddress,
    businessEmail,
  } = data;

  if (!businessName || !established || !businessLogoAddress) return false;
  return true;
};
