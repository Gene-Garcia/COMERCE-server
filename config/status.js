/*
 * PLACED - default status aftering placing the order
 * LOGISTICS - status set when the seller selects an order and its seller-products to be shipped out
 * // an orderd product with status of LOGISTICS does not indicate a ready to be picked up order
 * // because the seller will only know if they have sufficient inventory recorded when they click the SHIP ORDER button
 * // in the necessary page.
 *
 * PACKED - a PACKED ordered product indicates that the user have packed the order (with attached waybill). Done on the creation of  waybill.
 * but an order will remain PACKED until it has been set as PICK_UP by LOGISTICS. hence, waybill will be continuall created
 * PICK_UP - deliverer has picked up and to be delivered to the warehouse
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
  PACKED: "PACKED",

  // order status used by deliverer
  PICK_UP: "SELLER_PICK_UP",
  WAREHOUSE: "WAREHOUSE",

  DELIVERY: "CUSTOMER_DELIVERY",

  REVIEW: "DELIVERED_AND_FOR_REVIEW", // Delivered
  // end deliverer status used
  FULFILLED: "FULFILLED",
};
