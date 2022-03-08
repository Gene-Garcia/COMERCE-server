/*
 * this controll will handle all the shipment and logistics manipulation related
 * logic
 */

//utils
const { error } = require("../config/errorMessages");
const { orderStatuses } = require("../config/status");

// model
const Order = require("mongoose").model("Order");
const Product = require("mongoose").model("Product");
const Inventory = require("mongoose").model("Inventory");

/*
 * PATCH Method, Seller auth
 *
 * Dynamic controller-route where it can accept a list of orders and the products to ship.
 * The request may contain only 1 orders-products to ship or various orders-products to ship
 * Nonetheless, it will iterate an orders list. [{orderId: "", productIds: ["", "", ""]}, {...}, ...]
 */
exports.shipProductOrders = async (req, res) => {
  try {
    const { orders: toShip } = req.body;

    if (!toShip || toShip.length <= 0)
      return res.status(406).json({ error: error.invalidOrdersToShip });
    /*
     * Get all the orders whose products are intended is to be shipped
     *
     * Basically, an order and its entire product will be shipped.
     * However, only those with sufficient inventory will be set as LOGISTICS
     *
     * When all product status are LOGISTICS, then the order status is going to be LOGISTICS
     *
     * It is said the populate is more performant than doing individual async calls
     */
    const orders = await Order.find(
      {
        _id: { $in: toShip.map((e) => e.orderId) },
      },
      "status orderedProducts"
    )
      .populate({
        path: "orderedProducts",
        select: "status _product quantity",

        populate: {
          path: "_product",
          select: "item _inventory",

          populate: {
            path: "_inventory",
            select: "onHand",
          },
        },
      })
      .exec();

    // an array that will hold the data that will refer to the inventory to updated
    let inventoryBulkUpdate = [];
    let orderBulkUpdate = [];

    // iterate through each orders to perform the inventory manipulations
    orders.forEach((order) => {
      // variable to hold whenever every product of the order is all logistics
      let isAllLogistics = true;

      // the collection of product ids for the seller products
      const toShipProductIds = toShip
        .find((e) => JSON.stringify(e.orderId) === JSON.stringify(order._id))
        .productIds.map((productId) => JSON.stringify(productId));

      // iterate through each ordered products of an order
      order.orderedProducts.forEach((ordered) => {
        // only modify the ordered products for the current seller user
        if (toShipProductIds.includes(JSON.stringify(ordered._product._id))) {
          let orderedQuantity = ordered.quantity;

          // a temporary array to hold the inventory to be updated for this product
          let tempInventoryBulk = [];

          // iterate each product and its _inventory to determine whether the onHands and orderedQuantity matches
          ordered._product._inventory.every((inventory) => {
            const temp = {
              _id: "",
              onHand: 0,
            };

            // if ordered quantity for nth iteration is 0 then stop the loop.
            // we have already sufficed the order
            if (orderedQuantity <= 0) return false;

            //
            const remaining = orderedQuantity;
            orderedQuantity =
              orderedQuantity - inventory.onHand >= 0
                ? orderedQuantity - inventory.onHand // the result would be the remaining balance of ordered quantity
                : 0; // the ordered quantity is less than the onHand so this inventory will be able to suffice the balance order quantity
            inventory.onHand =
              inventory.onHand - remaining >= 0
                ? inventory.onHand - remaining // the remaining balance of the inventory after subtract the remaining orderd quantity
                : 0; // the inventory is now 0 because it has no more items. It has become lower than the ordered quantity, hence, it was not able to suffice the ordered quantity

            // modify temp
            temp._id = inventory._id;
            temp.onHand = inventory.onHand;

            tempInventoryBulk.push(temp);

            return true;
          });

          // if ordered quantity is sufficient with inventory, then save the
          // inventories (inside the temp) in the inventory bulk
          if (orderedQuantity <= 0) {
            inventoryBulkUpdate = inventoryBulkUpdate.concat(tempInventoryBulk);

            // set the product status as logistics
            ordered.status = orderStatuses.LOGISTICS;
          }
          // if the iteration reaches to the end without the quantity being 0
          // then the product will not be set to logistics
        }

        // on every orderedproduct regardless of seller owner
        // check all there status, if atleast 1 has a status of PLACED then the entire order cannot be set to LOGISTICS
        // we check using PLACED, because there would be instances where other products in the same order
        // has already been shipped (LOGISTICS) by the seller and would have already the status of WAREHOUSE
        if (ordered.status.toUpperCase() === orderStatuses.PLACED.toUpperCase())
          isAllLogistics = false;
      });

      // identify whether to place the entire order as LOGISTICS
      if (isAllLogistics) order.status = orderStatuses.LOGISTICS;

      // save the order to the bulk order to be updated
      orderBulkUpdate.push(order);
    });

    // build bulk write
    const inventoryBulkArray = inventoryBulkUpdate.map((inventory) => ({
      updateOne: {
        filter: { _id: inventory._id },
        update: { onHand: inventory.onHand },
        upsert: false,
      },
    }));
    const orderBulkArray = orderBulkUpdate.map((order) => ({
      updateOne: {
        filter: { _id: order._id },
        update: {
          status: order.status,
          orderedProducts: {
            status: order.orderedProducts.status,
          },
        },
        upsert: false,
      },
    }));

    // bulk update
    const inventoryRes = await Inventory.bulkWrite(inventoryBulkArray);
    const orderRes = await Order.bulkWrite(orderBulkArray);

    return res.status(200).json({ inventoryRes, orderRes });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: error.serverError });
  }
};
