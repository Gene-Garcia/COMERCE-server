/*
 * The current acronym equivalent of the COMERCE company supported
 * mode of payment. This variable is used because the client sends data
 * that uses acronym (i.e., keys of this object) instead of the complete name
 */
const types = {
  COD: "Cash-On-Delivery",
  CC: "Credit Card",
  PP: "PayPal",
};

/*
 * Wrapper function that accepts the type of payment mode the client has placed
 * for checkout. It also includes the data which is the form data of the payment component.
 *
 * Depending on the type of payment will call a different function that verify, validate, and return
 * the data form. Those function will return to false if the form data are incomplete or empty.
 *
 * A COD order will just return an empty object because there is no needed data.
 */
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

/*
 * validates and checks for all the needed data for credit card payment.
 * false if invalid or incomplete
 */
function populateCreditCard(data) {
  const { cardHolderName, cardNumber, cardExpiration, securityCode } = data;

  if (!cardHolderName || !cardNumber || !cardExpiration || !securityCode)
    return false;
  else return { cardHolderName, cardNumber, cardExpiration, securityCode };
}

/*
 * validates and checks for the paypal payment data needed.
 * false if invalid or incomplete
 */
function populatePayPal(data) {
  const { payPalEmail } = data;

  if (!payPalEmail) return false;
  else return { payPalEmail };
}
