const types = {
  COD: "Cash-On-Delivery",
  CC: "Credit Card",
  PP: "PayPal",
};

function populatePayment(type, data) {
  if (!type in types) return false;

  switch (type) {
    case "COD":
      return {}; // Does not contain any data

    case "CC":
      return populateCreditCard(data);

    case "PP":
      return populatePayPal(data);

    default:
      throw Error;
  }
}

module.exports = populatePayment;

function populateCreditCard(data) {
  const { cardHolderName, cardNumber, cardExpiration, securityCode } = data;

  if (!cardHolderName || !cardNumber || !cardExpiration || !securityCode)
    return false;
  else return { cardHolderName, cardNumber, cardExpiration, securityCode };
}

function populatePayPal(data) {
  const { payPalEmail } = data;

  if (!payPalEmail) return false;
  else return { payPalEmail };
}
