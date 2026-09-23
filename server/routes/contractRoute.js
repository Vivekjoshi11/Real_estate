const express = require("express");
const {
  getContractHealth,
  getTotalSupply,
  getToken,
  getTokenBalance,
  mintToken,
  getEscrowListing,
  getEscrowBalance,
  approveSale,
  updateInspection,
} = require("../controllers/contractController");

const router = express.Router();

router.route("/health").get(getContractHealth);

router.route("/real-estate/total-supply").get(getTotalSupply);
router.route("/real-estate/token/:tokenId").get(getToken);
router.route("/real-estate/balance/:address").get(getTokenBalance);
router.route("/real-estate/mint").post(mintToken);

router.route("/escrow/:tokenId").get(getEscrowListing);
router.route("/escrow/balance").get(getEscrowBalance);
router.route("/escrow/approve-sale").post(approveSale);
router.route("/escrow/update-inspection").post(updateInspection);

module.exports = router;
