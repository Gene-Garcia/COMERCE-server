/*
 * Contains helper related to parsing request paramters
 *
 */

/*
 *
 *
 */
exports.parseGetWaybillDataParams = (ordersParam, productsParam) => {
  const orderIds = ordersParam.split("+");
  const productIds = productsParam.split("-");

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
