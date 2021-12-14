/*
 * a helper method to validate the data from the client (seller page)
 * to upload new product. The data include inventory, default will be 0.
 */
exports.validateNewProductData = (data) => {
  const {
    item,
    retailPrice,
    wholesalePrice,
    wholesaleCap,
    description,
    inventory,
    imageAddress,

    brand,
    category,
    keywords,
  } = data;

  if (
    !item ||
    !retailPrice ||
    !wholesalePrice ||
    !wholesaleCap ||
    !description ||
    !inventory ||
    !imageAddress ||
    !brand ||
    !category ||
    !keywords
  )
    return false;
  return true;
};

/*
 * a utility method that parse a string data to an array of
 * string that represents an array of keywords
 *
 * delimeter is ',' coma
 */
exports.parseKeywords = (keywords) => {
  let words = [];

  return words;
};
