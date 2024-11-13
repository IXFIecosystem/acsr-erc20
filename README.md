# IXFI Token Project

This project is a custom ERC20 token contract implemented in Solidity, with additional features for ownership management through the `Ownable` contract. It includes functionality such as transfer, minting, burning, and management of blacklisted accounts. This README file will guide you on how to set up the project, compile the contracts, run test cases.

## Setup
This project uses Hardhat for development, testing, and deployment of smart contracts. Make sure you've installed all necessary dependencies by running:
```
npm install hardhat
```

## Compilation
To compile the Solidity contracts, use the following Hardhat command:
```
npx hardhat compile
```
This command will compile all .sol files in the contracts folder and output the compilation artifacts to the artifacts directory.

## Running Tests
To run the test cases, execute the following command:
```
npx hardhat test
```
This will run all test files located in the test folder and provide a summary of the test results.
