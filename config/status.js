/*
 * PLACED - default status aftering placing the order
 * Logistics - status set when the seller ships the product out for delivery
 * WAREHOUSE - atleast one of the ordered item has
 * REVIEW - status when the order is received by the customer. The product is now pending for user review
 * FULFILLED - status after having the ordered product reviewed. indicates the end of the product's order
 *
 * status of being logistics to warehouse will be updated by the logistics module
 */
exports.orderStatus = [
  "Placed",
  "Logistics",
  "Warehouse",
  "Review",
  "Fulfilled",
];
