require("dotenv").config({
  path: require("path").join(__dirname, ".config.env"),
});

const { ethers } = require("ethers");

const REAL_ESTATE_ABI = [
  "function mint(string tokenURI) returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
];

const ESCROW_ABI = [
  "function nftAddress() view returns (address)",
  "function seller() view returns (address)",
  "function inspector() view returns (address)",
  "function lender() view returns (address)",
  "function isListed(uint256) view returns (bool)",
  "function purchasePrice(uint256) view returns (uint256)",
  "function escrowAmount(uint256) view returns (uint256)",
  "function buyer(uint256) view returns (address)",
  "function inspectionPassed(uint256) view returns (bool)",
  "function approval(uint256, address) view returns (bool)",
  "function getBalance() view returns (uint256)",
  "function depositEarnest(uint256) payable",
  "function updateInspectionStatus(uint256, bool)",
  "function approveSale(uint256)",
  "function finalizeSale(uint256)",
  "function cancelSale(uint256)",
];

function isConfigured() {
  return Boolean(process.env.RPC_URL && process.env.REAL_ESTATE_ADDRESS);
}

function getProvider() {
  if (!process.env.RPC_URL) {
    return null;
  }
  return new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
}

function getRealEstateContract(runAsSigner = false) {
  const provider = getProvider();
  if (!provider || !process.env.REAL_ESTATE_ADDRESS) {
    return null;
  }

  if (runAsSigner && process.env.CONTRACT_PRIVATE_KEY) {
    const wallet = new ethers.Wallet(process.env.CONTRACT_PRIVATE_KEY, provider);
    return new ethers.Contract(
      process.env.REAL_ESTATE_ADDRESS,
      REAL_ESTATE_ABI,
      wallet
    );
  }

  return new ethers.Contract(
    process.env.REAL_ESTATE_ADDRESS,
    REAL_ESTATE_ABI,
    provider
  );
}

function getEscrowContract(runAsSigner = false) {
  const provider = getProvider();
  if (!provider || !process.env.ESCROW_ADDRESS) {
    return null;
  }

  if (runAsSigner && process.env.CONTRACT_PRIVATE_KEY) {
    const wallet = new ethers.Wallet(process.env.CONTRACT_PRIVATE_KEY, provider);
    return new ethers.Contract(process.env.ESCROW_ADDRESS, ESCROW_ABI, wallet);
  }

  return new ethers.Contract(process.env.ESCROW_ADDRESS, ESCROW_ABI, provider);
}

module.exports = {
  isConfigured,
  getProvider,
  getRealEstateContract,
  getEscrowContract,
  REAL_ESTATE_ABI,
  ESCROW_ABI,
};
