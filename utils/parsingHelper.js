/*
 * Contains helper related to parsing data, e.g. parameters or body
 *
 */

/*
 *
 *
 */
exports.parseGetWaybillDataIds = (ordersData, productsData) => {
  const orderIds = ordersData.split("+");
  const productIds = productsData.split("-");

  const orders = orderIds
    .map((id, i) => {
      if (productIds[i])
        return {
          orderId: id,
          productIds: productIds[i].split("+"),
        };
      else return null;
    })
    .filter((order) => order);

  return orders;
};
