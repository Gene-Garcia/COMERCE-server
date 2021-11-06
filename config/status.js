/*
 * PLACED - default status aftering placing the order
 * Logistics - status set when the seller ships the product out for delivery
 * REVIEW - status when the order is received by the customer. The product is now pending for user review
 * FULFILLED - status after having the ordered product reviewed. indicates the end of the product's order
 */
exports.orderStatus = ["Placed", "Logistics", "Review", "Fulfilled"];
