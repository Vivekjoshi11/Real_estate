const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const ErrorHandler = require("../utils/errorHandler");
const {
  isConfigured,
  getProvider,
  getRealEstateContract,
  getEscrowContract,
} = require("../config/contractConfig");

function requireContract(contract, message) {
  if (!contract) {
    throw new ErrorHandler(message, 503);
  }
  return contract;
}

// GET /api/contract/health
exports.getContractHealth = asyncErrorHandler(async (req, res, next) => {
  const provider = getProvider();

  if (!provider) {
    return res.status(503).json({
      success: false,
      message: "Contract API is not configured. Set RPC_URL in environment.",
    });
  }

  const network = await provider.getNetwork();
  const blockNumber = await provider.getBlockNumber();

  res.status(200).json({
    success: true,
    configured: isConfigured(),
    network: {
      name: network.name,
      chainId: network.chainId,
    },
    blockNumber,
    contracts: {
      realEstate: process.env.REAL_ESTATE_ADDRESS || null,
      escrow: process.env.ESCROW_ADDRESS || null,
    },
  });
});

// GET /api/contract/real-estate/total-supply
exports.getTotalSupply = asyncErrorHandler(async (req, res, next) => {
  const contract = requireContract(
    getRealEstateContract(),
    "RealEstate contract is not configured. Set REAL_ESTATE_ADDRESS and RPC_URL."
  );

  const totalSupply = await contract.totalSupply();

  res.status(200).json({
    success: true,
    totalSupply: totalSupply.toString(),
  });
});

// GET /api/contract/real-estate/token/:tokenId
exports.getToken = asyncErrorHandler(async (req, res, next) => {
  const tokenId = req.params.tokenId;

  if (!/^\d+$/.test(tokenId)) {
    return next(new ErrorHandler("tokenId must be a non-negative integer", 400));
  }

  const contract = requireContract(
    getRealEstateContract(),
    "RealEstate contract is not configured. Set REAL_ESTATE_ADDRESS and RPC_URL."
  );

  try {
    const [tokenURI, owner] = await Promise.all([
      contract.tokenURI(tokenId),
      contract.ownerOf(tokenId),
    ]);

    res.status(200).json({
      success: true,
      token: {
        tokenId,
        tokenURI,
        owner,
      },
    });
  } catch (err) {
    if (err?.code === "CALL_EXCEPTION" || err?.reason) {
      return next(new ErrorHandler("Token not found", 404));
    }
    throw err;
  }
});

// GET /api/contract/real-estate/balance/:address
exports.getTokenBalance = asyncErrorHandler(async (req, res, next) => {
  const address = req.params.address;

  if (!ethersIsAddress(address)) {
    return next(new ErrorHandler("Invalid Ethereum address", 400));
  }

  const contract = requireContract(
    getRealEstateContract(),
    "RealEstate contract is not configured. Set REAL_ESTATE_ADDRESS and RPC_URL."
  );

  const balance = await contract.balanceOf(address);

  res.status(200).json({
    success: true,
    address,
    balance: balance.toString(),
  });
});

// POST /api/contract/real-estate/mint
exports.mintToken = asyncErrorHandler(async (req, res, next) => {
  const { tokenURI } = req.body;

  if (!tokenURI || typeof tokenURI !== "string" || !tokenURI.trim()) {
    return next(new ErrorHandler("tokenURI is required", 400));
  }

  if (tokenURI.length > 2048) {
    return next(new ErrorHandler("tokenURI is too long", 400));
  }

  const contract = requireContract(
    getRealEstateContract(true),
    "Minting is not configured. Set REAL_ESTATE_ADDRESS, RPC_URL and CONTRACT_PRIVATE_KEY."
  );

  const tx = await contract.mint(tokenURI.trim());
  const receipt = await tx.wait();

  res.status(201).json({
    success: true,
    message: "Token minted",
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
  });
});

// GET /api/contract/escrow/:tokenId
exports.getEscrowListing = asyncErrorHandler(async (req, res, next) => {
  const tokenId = req.params.tokenId;

  if (!/^\d+$/.test(tokenId)) {
    return next(new ErrorHandler("tokenId must be a non-negative integer", 400));
  }

  const contract = requireContract(
    getEscrowContract(),
    "Escrow contract is not configured. Set ESCROW_ADDRESS and RPC_URL."
  );

  try {
    const [
      isListed,
      purchasePrice,
      escrowAmount,
      buyer,
      inspectionPassed,
    ] = await Promise.all([
      contract.isListed(tokenId),
      contract.purchasePrice(tokenId),
      contract.escrowAmount(tokenId),
      contract.buyer(tokenId),
      contract.inspectionPassed(tokenId),
    ]);

    res.status(200).json({
      success: true,
      listing: {
        tokenId,
        isListed,
        purchasePrice: purchasePrice.toString(),
        escrowAmount: escrowAmount.toString(),
        buyer,
        inspectionPassed,
      },
    });
  } catch (err) {
    if (err?.code === "CALL_EXCEPTION") {
      return next(new ErrorHandler("Listing not found", 404));
    }
    throw err;
  }
});

// GET /api/contract/escrow/balance
exports.getEscrowBalance = asyncErrorHandler(async (req, res, next) => {
  const contract = requireContract(
    getEscrowContract(),
    "Escrow contract is not configured. Set ESCROW_ADDRESS and RPC_URL."
  );

  const balance = await contract.getBalance();

  res.status(200).json({
    success: true,
    balance: balance.toString(),
  });
});

// POST /api/contract/escrow/approve-sale
exports.approveSale = asyncErrorHandler(async (req, res, next) => {
  const { tokenId } = req.body;

  if (tokenId === undefined || tokenId === null || !/^\d+$/.test(String(tokenId))) {
    return next(new ErrorHandler("tokenId must be a non-negative integer", 400));
  }

  const contract = requireContract(
    getEscrowContract(true),
    "Escrow writes are not configured. Set ESCROW_ADDRESS, RPC_URL and CONTRACT_PRIVATE_KEY."
  );

  const tx = await contract.approveSale(tokenId);
  const receipt = await tx.wait();

  res.status(200).json({
    success: true,
    message: "Sale approved",
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
  });
});

// POST /api/contract/escrow/update-inspection
exports.updateInspection = asyncErrorHandler(async (req, res, next) => {
  const { tokenId, passed } = req.body;

  if (tokenId === undefined || tokenId === null || !/^\d+$/.test(String(tokenId))) {
    return next(new ErrorHandler("tokenId must be a non-negative integer", 400));
  }

  if (typeof passed !== "boolean") {
    return next(new ErrorHandler("passed must be a boolean", 400));
  }

  const contract = requireContract(
    getEscrowContract(true),
    "Escrow writes are not configured. Set ESCROW_ADDRESS, RPC_URL and CONTRACT_PRIVATE_KEY."
  );

  const tx = await contract.updateInspectionStatus(tokenId, passed);
  const receipt = await tx.wait();

  res.status(200).json({
    success: true,
    message: "Inspection status updated",
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
  });
});

function ethersIsAddress(value) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}
