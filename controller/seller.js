// Models
const Business = require("mongoose").model("Business");
const Product = require("mongoose").model("Product");

// utils
const { error } = require("../config/errorMessages");

/*
 * This controller-route is designed for the seller dashboard landing page.
 * It is planned to send data for charts and information.
 *
 * For now, it will only send the business information (logoAddress and name)
 */
exports.dashboard = async (req, res, next) => {
  try {
    if (!req.user) res.status(406).json({ error: error.serverError });

    const b = await Business.findOne({ _owner: req.user._id }).exec();

    if (!b) res.status(404).json({ error: error.sellerAccountMissing });

    res.status(200).json({ businessName: b.businessName, businessLogo: "" });
  } catch (e) {
    res.status(500).json({ error: error.serverError });
  }
};

// products and inventories
/*
 * GET, SELLER-auth Method
 *
 * retrieves and sends the products of this seller user
 */
exports.findMyProducts = async (req, res, next) => {
  try {
    if (!req.user) res.status(406).json({ error: error.incompleteData });

    // find the business
    const business = await Business.findOne(
      { _owner: req.user._id },
      "_id"
    ).exec();

    if (!business) res.status(406).json({ error: error.incompleteData });

    let products = await Product.find(
      { _business: business._id },
      "imageAddress item retailPrice wholesalePrice "
    )
      .populate({
        path: "_inventory",
      })
      .exec();

    // rebuild data for client
    const data = products.map((e) => {
      let inventory = 0;
      e._inventory.forEach((f) => (inventory += f.onHand));

      return {
        ...e._doc,
        inventory,
        _inventory: null, // so that we would not send the array anymore to the client
      };
    });

    res.status(200).json({ products: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: error.serverError });
  }
};
