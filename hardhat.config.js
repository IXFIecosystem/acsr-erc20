require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
const dotenv = require("dotenv");

dotenv.config();

const INFURA_API_KEY = process.env.INFURA_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
  solidity: "0.8.12",
  networks: {
    sepolia: {
      url : `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY]
    }
  }
};