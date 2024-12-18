const { ethers } = require("hardhat");

async function main() {
  const owner = await ethers.getSigners();
  console.log(`deploying contract from: ${owner[0].address}`);

  //hardhat helper to get the ethers contractfactory object
  const TokenContract = await ethers.getContractFactory('ACSR');

  //Deploy the contract
  console.log('Deploying TokenContract');
  const tokenContract = await TokenContract.deploy();
  await tokenContract.deployed();
  console.log(`TokenContract deployed to: ${tokenContract.address}`);
}

main()
 .then(() => process.exit(0))
 .catch((error) => {
  console.error(error);
  process.exitCode = 1;
});