// Models
const User = require("mongoose").model("User");
const Business = require("mongoose").model("Business");

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
