/*
 * PLACED - default status aftering placing the order
 * LOGISTICS - status set when the seller selects an order and its seller-products to be shipped out
 * // an orderd product with status of LOGISTICS does not indicate a ready to be picked up order
 * // because the seller will only know if they have sufficient inventory recorded when they click the SHIP ORDER button
 * // in the necessary page.
 *
 * PACKED - a PACKED ordered product indicates that the user have packed the order (with attached waybill). Done on the creation of  waybill.
 * but an order will remain PACKED until it has been set as PICK_UP by LOGISTICS. hence, waybill will be continuall created.
 * Also, an order.status cannot be PACKED if not all of orderedProducts.status is PACKED
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
  PICK_UP: "SELLER PICK UP",
  WAREHOUSE: "WAREHOUSE",

  DELIVERY: "CUSTOMER DELIVERY",

  REVIEW: "DELIVERED AND FOR REVIEW", // Delivered
  // end deliverer status used
  FULFILLED: "FULFILLED",

  FAILED_CANCELLED: "FAILED AND CANCELLED DELIVERY", // either failed delivery to warehouse or failed delivery to customer
};

exports.orderStatusesHierarchy = {
  PLACED: 0,
  LOGISTICS: 1,
  PACKED: 2,
  "SELLER PICK UP": 3,
  WAREHOUSE: 4,
  "CUSTOMER DELIVERY": 5,
  "DELIVERED AND FOR REVIEW": 6,
  FULFILLED: 7,
  "FAILED AND CANCELLED DELIVERY": 8,
};
