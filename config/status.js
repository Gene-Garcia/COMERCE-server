/*
 * PLACED - default status aftering placing the order
 * LOGISTICS - status set when the seller ships the product out for delivery; ready for pick up
 * PICK_UP - deliverer pick up to be delivered to the warehouse
 * WAREHOUSE - deliverer succesful delivery of invididual ordered products to the warehouse; ready for customer delivery
 * DELIVERY - deliverer chooses an order where all of the products is in the warehouse
 * REVIEW - status when the order is received by the customer. The product is now pending for user review
 * FULFILLED - status after having the ordered product reviewed. indicates the end of the product's order
 *
 * status of being logistics to warehouse will be updated by the logistics module
 */

// IN ALL DEPENDECIES OR USER OF THIS VARIABLE. TRANSFORM THE VALUE TO UPPERCASE. MAKE IT CASE INSENSITIVE.

exports.orderStatuses = {
  PLACED: "PLACED",
  LOGISTICS: "LOGISTICS",

  // order status used by deliverer
  PICK_UP: "SELLER_PICK_UP",
  WAREHOUSE: "WAREHOUSE",

  DELIVERY: "CUSTOMER_DELIVERY",

  REVIEW: "DELIVERED_AND_FOR_REVIEW", // Delivered
  // end deliverer status used
  FULFILLED: "FULFILLED",
};
