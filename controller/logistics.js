/*
 * this controll will handle all the shipment and logistics manipulation related
 * logic
 */

//utils
const mongoose = require("mongoose");
const { deliveryTypes } = require("../config/deliveryType");
const { error } = require("../config/errorMessages");
const { orderStatuses, orderStatusesHierarchy } = require("../config/status");
const { parseGetWaybillDataIds } = require("../utils/parsingHelper");

// model
const Order = require("mongoose").model("Order");
const Product = require("mongoose").model("Product");
const Inventory = require("mongoose").model("Inventory");
const Business = require("mongoose").model("Business");
const Logistics = require("mongoose").model("Logistics");
const Deliverer = require("mongoose").model("Deliverer");

/*
 * PATCH Method, Seller auth
 *
 * Dynamic controller-route where it can accept a list of orders and the products to ship.
 * The request may contain only 1 orders-products to ship or various orders-products to ship
 * Nonetheless, it will iterate an orders list. [{orderId: "", productIds: ["", "", ""]}, {...}, ...]
 *
 * Updates each passed order and productIds and changes status to LOGISTICS, that is,
 * if product inventory is sufficient.
 *
 * Also performs inventory manipulations to update products' inventories if quantity matches
 *
 * Then, order.status will be updated once its ordered products has a status of 'LOGISTICS or higher'
 */
exports.shipProductOrders = async (req, res) => {
  try {
    const { orders: toShip } = req.body;

    if (!toShip || toShip.length <= 0)
      return res.status(406).json({ error: error.invalidOrdersToShip });

    let messages = [];

    await Promise.all(
      toShip.map(async ({ orderId, productIds: reqProductIds }) => {
        // these are usually success messages but since this is a transaction, the transaction could be aborted so the message will be useless
        let tempMessages = [];

        // individually turning each product ids to stringify because they are using single quotes
        let productIds = reqProductIds.map((id) => JSON.stringify(id));

        const session = await mongoose.connection.startSession();
        try {
          session.startTransaction();

          if (orderId && productIds.length > 0) {
            const order = await Order.findById(
              orderId,
              "shipmentDetails status orderedProducts"
            ).session(session);

            let areAllLogisticsOrHigher = true;

            // iterated ordered products to make inventory validations and manipulations
            await Promise.all(
              order.orderedProducts.map(async (orderedProduct, idx) => {
                const stringifiedId = JSON.stringify(orderedProduct._product);
                console.log(
                  "stringifiedId",
                  stringifiedId,
                  typeof stringifiedId
                );

                if (productIds.includes(stringifiedId)) {
                  // find product and get inventory
                  const product = await Product.findById(
                    orderedProduct._product,
                    "item _inventory"
                  )
                    .populate({ path: "_inventory", select: "onHand" })
                    .session(session);

                  //#region inventory manipulations
                  let updatedInventories = [];

                  let quantity = order.orderedProducts[idx].quantity;
                  product._inventory.forEach(({ _id, onHand }, idx) => {
                    if (quantity > 0) {
                      let oldQuantity = quantity;
                      quantity -= onHand;

                      // handling negative. Negative means there is still onHand even after reducing quantity
                      if (quantity < 0) quantity = 0;

                      // compute new onHand value
                      const taken = oldQuantity - quantity;
                      product._inventory[idx].onHand -= taken;

                      // save id and onHand so it can be updated
                      updatedInventories.push({
                        id: _id,
                        onHand: product._inventory[idx].onHand,
                      });
                    }
                  });
                  //#endregion

                  if (quantity > 0) {
                    messages.push({
                      message: `Order for ${order.shipmentDetails.firstName} ${order.shipmentDetails.lastName} not shipped`,
                      severity: "information",
                    });
                    messages.push({
                      message: `${product.item} has insufficient quantity`,
                      severity: "warning",
                    });

                    // ABORT PROCESSING FOR CURRENT ORDER. PROCEED TO NEXT ORDER
                    // we need to stop the MAP loop await session.abortTransaction();
                    throw "Insufficient quantity"; // just raise an error to break the session entirely and proceed to next order
                  } else {
                    // update inventory
                    await Promise.all(
                      updatedInventories.map(async ({ id, onHand }) => {
                        await Inventory.findOneAndUpdate(
                          { _id: id },
                          { onHand: onHand }
                        ).session(session);
                      })
                    );
                    tempMessages.push({
                      message: `Inventory of ${product.item} updated`,
                      severity: "information",
                    });

                    // update order.orderedProducts.status
                    order.orderedProducts[idx].status = orderStatuses.LOGISTICS;

                    console.log("order", order);
                    console.log("product", product);
                  }
                } // else not in toShip[].products = pass

                // areAllLogisticsOrHigher
                if (
                  orderStatusesHierarchy[order.orderedProducts[idx].status] <
                  orderStatusesHierarchy[orderStatuses.LOGISTICS]
                ) {
                  // status of order could still be at PLACED
                  areAllLogisticsOrHigher = false;
                } // else orderedProduct has a status higher than PLACED
              })
            );

            // check order.status
            if (areAllLogisticsOrHigher) {
              order.status = orderStatuses.LOGISTICS;
            }

            // update order
            await order.save();

            await session.commitTransaction();

            // message
            messages.push({
              message: `Your products for the order of ${order.shipmentDetails.firstName} ${order.shipmentDetails.lastName} is waiting to be packed`,
              severity: "success",
            });

            // since transaction was not aborted, add the temp messages
            messages = [...messages, ...tempMessages];
          } else {
            messages.push({ message: "Order not found", severity: "error" });
            throw "Order not found";
          }
        } catch (err) {
          // throwing error will go here

          console.log(err.message);
          await session.abortTransaction();
        } finally {
          session.endSession();
        }
      })
    );

    return res.status(201).json({ messages });
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

    let updatedOrders = [];
    let messages = [];

    await Promise.all(
      orders.map(async ({ orderId, productIds }) => {
        let areAllPackedOrHigher = true;

        const session = await mongoose.connection.startSession();
        try {
          session.startTransaction();

          const order = await Order.findById(
            orderId,
            "status shipmentDetails orderedProducts"
          ).session(session);

          //#region validations
          if (!order) {
            messages.push({
              message: `Order of ${orderId} not found`,
              severity: "warning",
            });

            throw "Order not found";
          }

          if (!productIds || productIds.length <= 0) {
            messages.push({
              message: `Ordered products of ${orderId} not found`,
              severity: "warning",
            });

            throw "Ordered products not found";
          }
          //#endregion

          // iterate and match ordered products
          order.orderedProducts.forEach((orderedProduct, idx) => {
            //#region console logs for testing
            // console.log(
            //   productIds,
            //   "|",
            //   orderedProduct._product,
            //   "is type of",
            //   typeof orderedProduct._product
            // );
            // console.log(
            //   "productIds.includes(String(orderedProduct._product)",
            //   productIds.includes(String(orderedProduct._product))
            // );
            // console.log(
            //   "productIds.includes(JSON.stringify(orderedProduct._product))",
            //   productIds.includes(JSON.stringify(orderedProduct._product))
            // );

            // console.log(
            //   "\t\t",
            //   orderedProduct._product,
            //   "is a typeof",
            //   typeof orderedProduct._product,
            //   productIds[0],
            //   "is a typeof",
            //   typeof productIds[0]
            // );
            // console.log(
            //   "\t\t",
            //   String(orderedProduct._product) === productIds[0],
            //   `using string String(${orderedProduct._product})`
            // );
            // console.log(
            //   "\t\t",
            //   JSON.stringify(orderedProduct._product) === productIds[0],
            //   `using stringify JSON.stringify(${orderedProduct._product})`
            // );
            //#endregion

            if (productIds.includes(String(orderedProduct._product))) {
              order.orderedProducts[idx].status = orderStatuses.PACKED;
            } // else product not in request or product not from seller

            // areAllPacked
            if (
              orderStatusesHierarchy[order.orderedProducts[idx].status] <
              orderStatusesHierarchy[orderStatuses.PACKED]
            ) {
              areAllPackedOrHigher = false; // atleast one order has a hierarchy less than being PACKED
            }
          });

          if (areAllPackedOrHigher) order.status = orderStatuses.PACKED;

          // save
          await order.save(session);

          await session.commitTransaction();

          updatedOrders.push(order._id);

          messages.push({
            message: `Prepare packing ordered products of ${order.shipmentDetails.firstName} ${order.shipmentDetails.lastName}`,
            severity: "information",
          });
        } catch (err) {
          await session.abortTransaction();

          messages.push({
            message: `Unable to prepare order ${orderId}`,
            severity: "error",
          });
        } finally {
          session.endSession();
        }
      })
    );

    return res.status(201).json({ updatedOrders, messages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: error.serverError });
  }
};

/*
 * GET Method, Logistics auth
 *
 * For pick up products are orderedProducts whose status are PACKED.
 * Regardless if order.status is PACKED or NOT, orderedProducts from different
 * seller can be picked up by logistics. So they will be stored in the warehouse
 * until all other orderedProducts from the same order will be present in the WAREHOUSE
 *
 * In other words, an order with orderedProducts from different seller will be PICK_UP by the
 * logistics at different times. They will all just meet and be prepared in the WAREHOUSE.
 */
exports.getForPickUpProducts = async (req, res) => {
  try {
    let orders = await Order.find(
      {
        "orderedProducts.status": orderStatuses.PACKED,
      },
      "status orderedProducts.quantity orderedProducts._product orderedProducts.status"
    ).populate({
      path: "orderedProducts._product",
      select: "item _business",

      populate: {
        path: "_business",
        select: "businessEmail contactNumber businessName pickUpAddress",
      },
    });

    // I need it to be an object of objects so that I can check if businessId is existing
    let forPickUpProducts = {};

    /*
     * We will build the array of forPickUpProducts which is grouped by
     * businessId.
     *
     * So, if order1 and order2 have PACKED orderedProducts then they will be
     * stored in one object
     *
     * the 'orders' will contain NON-PACKED orderedProducts.status-needs filtering
     */
    orders.forEach((order) => {
      order.orderedProducts.forEach((product) => {
        if (product.status.toUpperCase() === orderStatuses.PACKED) {
          if (product._product) {
            const businessIdKey = product._product._business._id;

            if (businessIdKey in forPickUpProducts) {
              // existing business object

              // find object
              // increment quantity
              // append in orders

              if (order._id in forPickUpProducts[businessIdKey].orders) {
                // order is already record
                forPickUpProducts[businessIdKey].orders[order._id].push({
                  productId: product._product._id,
                  itemName: product._product.item,
                });
              } else {
                // new order
                forPickUpProducts[businessIdKey].orders[order._id] = [
                  {
                    productId: product._product._id,
                    itemName: product._product.item,
                  },
                ];
              }

              forPickUpProducts[businessIdKey].productQuantity +=
                product.quantity;
            } else {
              // new business object

              // populate template
              let template = {
                businessName: product._product._business.businessName,
                email: product._product._business.businessEmail,
                contactNumber: product._product._business.contactNumber,
                pickUpAddress: product._product._business.pickUpAddress,

                productQuantity: product.quantity,

                orders: {
                  [order._id]: [
                    {
                      productId: product._product._id,
                      itemName: product._product.item,
                    },
                  ],
                },

                // object property needed in the fronted
                checked: false,
              };

              // save new business object
              forPickUpProducts[businessIdKey] = {
                ...template,
              };
            }
          }
        }
      });
    });

    return res.status(200).json({ forPickUpProducts });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: error.serverError });
  }
};

/*
 * POST Method, logistics auth
 *
 * Creates a logistics document/model record for the PICK_UP orders
 * Iterates and finds the order and matches the products to update the
 * order and orderedProduct status to PICK_UP
 */
exports.pickUpProducts = async (req, res) => {
  /*
    data structure of request body 
    products = {
            BUSINESSID: {
              businessName: 'Apple',
              email: 'apple@biz.com',
              contactNumber: 9053660668,
              pickUpAddress: {
                street: 'Lot 1 Block 14',
                barangay: 'San Francisco',
                cityMunicipality: 'Binan',
                province: 'Laguna'
              },
              productQuantity: 15,
              orders: {
                '624914c0b6f1580e80ccfb6a': [Array],
                '6249151bb6f1580e80ccfbde': [Array]
              },
              checked: false
            }  
          }

  */

  try {
    const { products } = req.body;

    if (!products)
      return res.status(406).json({ message: error.incompleteData });

    // find deliverer
    const deliverer = await Deliverer.findOne(
      { _user: req.user._id },
      "_id"
    ).exec();
    if (!deliverer)
      return res.status(406).json({ message: error.logisticsAccountNotFound });

    let messages = [];

    await Promise.all(
      Object.entries(products).map(async ([businessId, product]) => {
        const tempMessages = [];

        const session = await mongoose.connection.startSession();

        try {
          session.startTransaction();

          // create logistics
          const logistics = Logistics({
            _deliverer: deliverer._id,
            _business: businessId,
            orders: [],
            logisticsType: deliveryTypes.SELLER_PICK_UP,
            dateStarted: Date.now(),
          });

          // build array of orders and array of orders.products
          Object.entries(product.orders).forEach(([orderId, productsArray]) => {
            let tempOrder = {
              _order: orderId,
              products: productsArray.map((prodArr) => prodArr.productId),
            };

            logistics.orders.push(tempOrder);
          });

          await logistics.save({ session });

          // create message
          tempMessages.push({
            message: `Logistics record for ${businessId} created.`,
            severity: "success",
          });

          // iterate and find orders and update status as pick up
          await Promise.all(
            logistics.orders.map(async (logiOrder) => {
              let tempMessage = "Products '";

              let order = await Order.findById(logiOrder._order).session(
                session
              );

              let isAllPickUp = true;
              order.orderedProducts.map(async (orderedProduct, i) => {
                if (logiOrder.products.includes(orderedProduct._product)) {
                  order.orderedProducts[i].status = orderStatuses.PICK_UP;

                  tempMessage += orderedProduct._product;
                } else {
                  // if atleast one of orderedProducts._product is not in the productsArray
                  // then not yet PACKED because were not rendered in the client
                  isAllPickUp = false;
                }
              });

              tempMessage +=
                "' of order " +
                logiOrder._order +
                " set to " +
                orderStatuses.PICK_UP;
              tempMessages.push({
                message: tempMessage,
                severity: "information",
              });

              if (isAllPickUp) {
                order.status = orderStatuses.PICK_UP;

                tempMessages.push({
                  message:
                    "Order " +
                    logiOrder._order +
                    " set to " +
                    orderStatuses.PICK_UP,
                  severity: "information",
                });
              }
              // update
              await order.save({ session });
            })
          );

          await session.commitTransaction();

          // reaching here means this product-order record has been processed for logistics
          messages = [...messages, ...tempMessages];
        } catch (err) {
          await session.abortTransaction();
          console.error(err);
          messages.push({
            message: "Unable to pick up order(s)",
            severity: "error",
          });
        } finally {
          session.endSession();
        }
      })
    );

    return res.status(200).json({ messages });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: error.serverError });
  }
};

/*
 * GET, logistics auth
 *
 * Gets all of the logistics record that are not COMPLETED-checked if success field is empty or not.
 * Depending on the url parameter-logisticsType, either SELLER_PICK_UP or CUSTOMER_DELIVERY, will affect
 * the logistics data retrieved.
 */
exports.getLogisticsWithMe = async (req, res) => {
  try {
    const { logisticsType } = req.params;
    console.log(logisticsType);

    if (!logisticsType)
      return res.status(406).json({ message: error.incompleteData });

    // find deliverer
    const deliverer = await Deliverer.find(
      { _user: req.user._id },
      "_id"
    ).exec();
    if (!deliverer)
      return res.status(404).json({ message: error.logisticsAccountNotFound });

    let logistics = await Logistics.find(
      {
        logisticsType: logisticsType.toUpperCase(),
        deliverer: deliverer._id,
      },
      "_business orders dateStarted failedAttempts"
    ).populate([
      {
        path: "orders._order",
        select: "orderDate ETADate",
      },
      { path: "_business", select: "businessName pickUpAddress contactNumber" },
    ]);

    // add check property
    logistics = logistics.map((logistic) => ({
      ...logistic._doc,
      checked: false,
    }));

    console.log(logistics);

    return res.status(200).json({ logistics });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.error });
  }
};

/*
 * PATCH, Logistics auth
 *
 * Add a failed attempt to logistics record with the deliverer
 * After saving attempt, if count is 2 then the product will now be considered
 * as cancelled.
 */
exports.recordFailedAttempts = async (req, res) => {
  try {
    const { logisticsId, reason } = req.body;

    if (!reason || !logisticsId)
      return res.status(406).json({ message: error.incompleteData });

    // find deliverer
    const deliverer = await Deliverer.findOne(
      { _user: req.user._id },
      "_id"
    ).exec();
    if (!deliverer)
      return res.status(404).json({ message: error.delivererNotFound });

    // find logistics
    const logistics = await Logistics.findById(
      logisticsId,
      "failedAttempts"
    ).exec();

    // new attempt record
    const attempt = {
      reason: reason.trim(),
      attemptDate: Date.now(),
    };
    logistics.failedAttempts.push(attempt);

    // save
    await logistics.save();

    // if attempt is already 2, CANCEL the logistics
    if (logistics.failedAttempts.length >= 2) {
      return res.status(201).json({
        message: `${logisticsId} reached final attempt. Logistics cancelled.`,
      });
    } else {
      return res
        .status(201)
        .json({ message: `Delivery attempt to ${logisticsId} recorded.` });
    }
  } catch (e) {
    return res.status(500).json({ message: error.serverError });
  }
};
