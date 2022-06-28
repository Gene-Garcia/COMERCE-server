/*
 * this controll will handle all the shipment and logistics manipulation related
 * logic
 */

//utils
const { error } = require("../config/errorMessages");
const { orderStatuses } = require("../config/status");
const { parseGetWaybillDataIds } = require("../utils/parsingHelper");

// model
const Order = require("mongoose").model("Order");
const Product = require("mongoose").model("Product");
const Inventory = require("mongoose").model("Inventory");
const Business = require("mongoose").model("Business");

/*
 * PATCH Method, Seller auth
 *
 * Dynamic controller-route where it can accept a list of orders and the products to ship.
 * The request may contain only 1 orders-products to ship or various orders-products to ship
 * Nonetheless, it will iterate an orders list. [{orderId: "", productIds: ["", "", ""]}, {...}, ...]
 */
exports.shipProductOrders = async (req, res) => {
  let message = "";

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
     * When atleast one product is LOGISTICS, then the entire order will be LOGISTICS even if other products
     * are still PLACED
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
        // select all because we need to retain those data after bulk writing
        // the problem encountered was that updating order does perform PATCH logic,
        // but updating the array of orderedProducts and setting only the status performs
        // a PUT logic where every other field of orderedProducts is replaced only with that status

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
      let isOneLogistics = true;

      // the collection of product ids for the seller products
      // these product ids are ensured to be only those ordered products
      // whose status are PLACED.
      // Because when the fronted renders the UI for shipping products, it
      // makes an API request to get all orders with orderedProducts whose status is LOGISTICS
      const toShipProductIds = toShip.find(
        (e) => JSON.stringify(e.orderId) === JSON.stringify(order._id)
      ).productIds;

      // iterate through each product Ids to ship and find their corresponding orderedProduct._product
      toShipProductIds.forEach((productId) => {
        // find orderedProduct
        const orderedProductIndex = order.orderedProducts.findIndex(
          (orderedProduct) => {
            console.log(JSON.stringify(orderedProduct._product._id));
            console.log(JSON.stringify(productId));
            return (
              JSON.stringify(orderedProduct._product._id) ===
              JSON.stringify(productId)
            );
          }
        );

        console.log(orderedProductIndex);
        console.log(order.orderedProducts[orderedProductIndex]);

        let orderedQuantity =
          order.orderedProducts[orderedProductIndex].quantity;

        // a temporary array to hold the inventory to be updated for this product
        let tempInventoryBulk = [];

        order.orderedProducts[orderedProductIndex]._product._inventory.every(
          (inventory) => {
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
          }
        );

        // if ordered quantity is sufficient with inventory, then save the
        // inventories (inside the temp) in the inventory bulk
        if (orderedQuantity <= 0) {
          inventoryBulkUpdate = inventoryBulkUpdate.concat(tempInventoryBulk);

          // set the product status as logistics
          order.orderedProducts[orderedProductIndex].status =
            orderStatuses.LOGISTICS;

          // this indicate that atleast one product in the order is for LOGISTICS
          isOneLogistics = true;
        }
        // if the iteration reaches to the end without the quantity being 0
        // then the product will not be set to logistics

        // satisfying this condition indicates that the current product is not shippable due to low inventory
        if (
          order.orderedProducts[orderedProductIndex].status.toUpperCase() ===
          orderStatuses.PLACED.toUpperCase()
        ) {
          // s
          message =
            message +
            " Products " +
            order.orderedProducts[orderedProductIndex]._product.item +
            " has insufficient quantity.";
        } else {
        }
      });

      // identify whether to place the entire order as LOGISTICS
      if (isOneLogistics) {
        order.status = orderStatuses.LOGISTICS;

        message = `${message} Order ${order._id} status has been set to as 'Logistics'.`;
      }

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
          orderedProducts: order.orderedProducts.map((e) => ({
            rated: e.rated,
            _id: e._id,
            status: e.status,
            _product: e._product._id,
            priceAtPoint: e.priceAtPoint,
            quantity: e.quantity,
          })),
        },
        upsert: false,
      },
    }));

    // bulk update
    const inventoryRes = await Inventory.bulkWrite(inventoryBulkArray);
    const orderRes = await Order.bulkWrite(orderBulkArray);

    if (inventoryRes.result.writeErrors.length > 0)
      message += `An was encountered in updating the inventory`;

    if (orderRes.result.writeErrors.length > 0)
      message += `An was encountered in updating the order record`;

    return res.status(200).json({ message, inventoryRes, orderRes });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: error.serverError });
  }
};

/*
 * GET Method, Logistics auth
 *
 * DEPRECATED, NEED UPDATED
 *
 * A logistics user method that returns all ordered products that are LOGISTICS.
 * Basically all orders that has a status of LOGISTICS is guaranteed to have atleast 1
 * ordered products' status to be LOGISTISCS
 */
exports.getForPickUpProducts = async (req, res) => {
  try {
    let orders = await Order.find(
      {
        status: orderStatuses.LOGISTICS,
        "orderedProducts.status": orderStatuses.LOGISTICS,
      },
      "ETADate status orderedProducts.status orderedProducts._product"
    )
      .populate({
        path: "orderedProducts._product",
        select: "item _business",

        populate: {
          path: "_business",
          select: "businessName",
        },
      })
      .exec();

    // we will filter every order orderedproducts to retain only products with status of PACKED
    orders = orders.map((order) => ({
      ...order._doc,
      orderedProducts: order.orderedProducts.filter(
        (product) => product.status === orderStatuses.LOGISTICS
      ),
    }));

    return res.status(200).json({ orders });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: error.serverError });
  }
};

/*
 * GET Method, Seller auth
 *
 * Queries all the necessary data to be showed in the waybill of an order
 */
exports.getWaybillData = async (req, res) => {
  try {
    // parse paramater
    const ordersToPrint = parseGetWaybillDataIds(
      req.params.orders,
      req.params.products
    );

    // get business first
    const business = await Business.findOne(
      { _owner: req.user._id },
      "pickUpAddress businessName contactNumber"
    );
    if (!business)
      return res.status(404).json({ error: error.sellerAccountMissing });

    let waybillOrders = [];

    await Promise.all(
      ordersToPrint.map(async ({ orderId, productIds }) => {
        if (!orderId)
          return res.status(406).json({ error: error.incompleteData });

        // get orders, and filter null orderedProducts._product
        const order = await Order.findById(
          orderId,
          `-orderDate -ETADate -paymentInformation -orderedProducts.rated`
        )
          .populate({
            path: "orderedProducts._product",
            select: "item",
            match: { _id: { $in: productIds } },
          })
          .map((ord) => ({
            ...ord._doc,
            orderedProducts: ord.orderedProducts.filter(
              (product) => product._product
            ),
          }));

        if (!order) return res.status(404).json({ error: error.orderNotFound });

        waybillOrders.push(order);
      })
    );

    return res.status(200).json({ waybillOrders, business });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

/*
 * PATCH Method, seller auth
 *
 * Sets orders's ordered Products as PACKED
 * body also includes orderIds with productIds: orderId+orderId... & productId+productId-productId...
 *
 * Sets the orders.status to PACKED if all are PACKED
 *
 * PACKED indicates an order and its item from the same seller are printed and attached
 * with a waybill
 */
exports.packOrders = async (req, res) => {
  try {
    const orders = req.body.orders;

    let customerNames = [];
    let updatedOrders = [];

    await Promise.all(
      orders.map(async ({ orderId, productIds }) => {
        if (!orderId)
          return res.status(406).json({ error: error.incompleteData });

        // get orders and all orderedProducts, regardless if from different sellers
        const order = await Order.findById(orderId).populate({
          path: "orderedProducts._product",
          select: "item",
          match: { _id: { $in: productIds } },
        });

        if (!order) return res.status(404).json({ error: error.orderNotFound });

        // ordered product status
        let isAllPacked = true;

        order.orderedProducts = order.orderedProducts.map((product) => {
          // the query to populate the order.orderedProducts only populates those in productIds
          // we can use to check if _product is not null to know which order.orderedProduct.status to be set as PACKED
          if (product._product) product.status = orderStatuses.PACKED;

          // although, only orderedProduct in productIds will have _product the orderedProduct.status is still
          if (product.status.toUpperCase() != orderStatuses.PACKED)
            isAllPacked = false;

          return product;
        });

        if (isAllPacked) order.status = orderStatuses.PACKED;

        // finally, update order
        await order.save();

        updatedOrders.push(order._id);
        customerNames.push(
          order.shipmentDetails.firstName + " " + order.shipmentDetails.lastName
        );
      })
    );

    if (updatedOrders.length > 0)
      return res.status(201).json({
        message: `Orders for customers ${customerNames.join(
          ","
        )} are now updated as Packed.`,
        updatedOrders,
      });
    else
      return res.status(200).json({
        message:
          "Unable to updated printed waybill orders. Something went wrong, try again.",
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: error.serverError });
  }
};
