const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Main Contract Testing", () => {
  before(async function () {
    this.TokenContract = await ethers.getContractFactory("ACSR");
  });

  beforeEach(async function () {
    this.tokenContract = await this.TokenContract.deploy();
    await this.tokenContract.deployed();

    const signers = await ethers.getSigners();

    this.owner = signers[0];
    this.user1 = signers[1];
    this.user2 = signers[2];

    this.ownerContract = this.tokenContract.connect(this.owner);
    this.user1Contract = this.tokenContract.connect(this.user1);
    this.user2Contract = this.tokenContract.connect(this.user2);
  });

  // Test cases

  it("Creates a token with specific details", async function () {
    expect(await this.tokenContract.name()).to.equal('ACSR Token');
    expect(await this.tokenContract.symbol()).to.equal('ACSR');
    expect(await this.tokenContract.totalSupply()).to.equal('5000000000000000000000000000');
  });

  it("Balance of the Owner should be the total supply", async function () {
    const initialBalanceOwner = await this.tokenContract.balanceOf(this.owner.address);
    const totalSupply = await this.tokenContract.totalSupply();
    expect(initialBalanceOwner).to.equal(totalSupply);
  });

  it("Should set the deployer as the initial owner", async function () {
    const isOwner = await this.tokenContract.isOwner(this.owner.address);
    expect(isOwner).to.equal(true);
  });

  it("Pauses and Unpauses the contract", async function () {
    expect(await this.tokenContract.paused()).to.equal(false);

    await this.tokenContract.pause();
    expect(await this.tokenContract.paused()).to.equal(true);

    await this.tokenContract.unpause();
    expect(await this.tokenContract.paused()).to.equal(false);
  });

  it("Unable to do the Transaction when pause", async function () {
    await this.tokenContract.pause();
    const transferAmount = ethers.utils.parseEther("100");
    await expect(this.tokenContract.transfer(this.user1.address, transferAmount)).to.be.reverted;
  });

  it("Transfers tokens between accounts", async function () {
    const transferAmount = ethers.utils.parseEther("100");
    await this.tokenContract.transfer(this.user1.address, transferAmount);
    
    const user1Balance = await this.tokenContract.balanceOf(this.user1.address);
    expect(user1Balance).to.equal(transferAmount);

    const ownerBalance = await this.tokenContract.balanceOf(this.owner.address);
    expect(ownerBalance).to.equal((await this.tokenContract.totalSupply()).sub(transferAmount));
  });

  it("Approves allowance for another address", async function () {
    const allowanceAmount = ethers.utils.parseEther("50");

    await this.tokenContract.approve(this.user1.address, allowanceAmount);
    const allowance = await this.tokenContract.allowance(this.owner.address, this.user1.address);
    expect(allowance).to.equal(allowanceAmount);
  });

  it("Transfers tokens using transferFrom with allowance", async function () {
    const transferAmount = ethers.utils.parseEther("100");
    await this.tokenContract.approve(this.user1.address, transferAmount);
    await this.user1Contract.transferFrom(this.owner.address, this.user2.address, transferAmount);

    const user2Balance = await this.tokenContract.balanceOf(this.user2.address);
    expect(user2Balance).to.equal(transferAmount);

    const remainingAllowance = await this.tokenContract.allowance(this.owner.address, this.user1.address);
    expect(remainingAllowance).to.equal(0);
  });

  it("Increase and decrease allowance", async function () {
    const initialAllowance = ethers.utils.parseEther("50");
    const increaseAmount = ethers.utils.parseEther("30");
    const decreaseAmount = ethers.utils.parseEther("20");

    await this.tokenContract.approve(this.user1.address, initialAllowance);
    await this.tokenContract.increaseAllowance(this.user1.address, increaseAmount);

    let allowance = await this.tokenContract.allowance(this.owner.address, this.user1.address);
    expect(allowance).to.equal(initialAllowance.add(increaseAmount));

    await this.tokenContract.decreaseAllowance(this.user1.address, decreaseAmount);
    allowance = await this.tokenContract.allowance(this.owner.address, this.user1.address);
    expect(allowance).to.equal(initialAllowance.add(increaseAmount).sub(decreaseAmount));
  });

  it("Burn tokens", async function () {
    const burnAmount = ethers.utils.parseEther("500");

    const initialTotalSupply = await this.tokenContract.totalSupply();
    const initialOwnerBalance = await this.tokenContract.balanceOf(this.owner.address);

    await this.tokenContract.burn(burnAmount);

    const finalTotalSupply = await this.tokenContract.totalSupply();
    const finalOwnerBalance = await this.tokenContract.balanceOf(this.owner.address);

    expect(finalTotalSupply).to.equal(initialTotalSupply.sub(burnAmount));
    expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(burnAmount));
  });

  it("Destroy blacklisted user funds", async function () {
    const transferAmount = ethers.utils.parseEther("200");
    const initialTotalSupply = (await this.tokenContract.totalSupply()).sub(transferAmount);
    await this.tokenContract.transfer(this.user2.address, transferAmount);
    await this.tokenContract.blacklistAccount(this.user2.address, true);
    await this.tokenContract.destroyBlackFunds(this.user2.address);

    const user1Balance = await this.tokenContract.balanceOf(this.user2.address);
    expect(user1Balance).to.equal(0);

    const totalSupply = await this.tokenContract.totalSupply();
    expect(totalSupply).to.equal(initialTotalSupply);
  });

  it("Prevent transactions from blacklisted addresses", async function () {
    await this.tokenContract.blacklistAccount(this.user1.address, true);

    await expect(this.user1Contract.transfer(this.user2.address, 100))
      .to.be.revertedWith('Sender address in blacklist');
  });

  it("Should emit Transfer event on successful transfer", async function () {
    const transferAmount = ethers.utils.parseEther("100");
    await expect(this.tokenContract.transfer(this.user1.address, transferAmount))
      .to.emit(this.tokenContract, "Transfer")
      .withArgs(this.owner.address, this.user1.address, transferAmount);
  });

  it("Should emit Approval event on successful approval", async function () {
    const approvalAmount = ethers.utils.parseEther("50");
    await expect(this.tokenContract.approve(this.user1.address, approvalAmount))
      .to.emit(this.tokenContract, "Approval")
      .withArgs(this.owner.address, this.user1.address, approvalAmount);
  });

  it("Should emit Transfer event on transferFrom", async function () {
    const approvalAmount = ethers.utils.parseEther("50");
    const transferAmount = ethers.utils.parseEther("30");
    await this.tokenContract.approve(this.user1.address, approvalAmount);
    await expect(this.user1Contract.transferFrom(this.owner.address, this.user2.address, transferAmount))
      .to.emit(this.tokenContract, "Transfer")
      .withArgs(this.owner.address, this.user2.address, transferAmount);
  });

  it("Should emit Approval event on increaseAllowance", async function () {
    const increaseAmount = ethers.utils.parseEther("25");
    await expect(this.tokenContract.increaseAllowance(this.user1.address, increaseAmount))
      .to.emit(this.tokenContract, "Approval")
      .withArgs(this.owner.address, this.user1.address, increaseAmount);
  });

  it("Should emit Approval event on decreaseAllowance", async function () {
    const initialAllowance = ethers.utils.parseEther("100");
    const decreaseAmount = ethers.utils.parseEther("40");
    await this.tokenContract.approve(this.user1.address, initialAllowance);
    await expect(this.tokenContract.decreaseAllowance(this.user1.address, decreaseAmount))
      .to.emit(this.tokenContract, "Approval")
      .withArgs(this.owner.address, this.user1.address, initialAllowance.sub(decreaseAmount));
  });

  it("Should emit Transfer event on token burning", async function () {
    const burnAmount = ethers.utils.parseEther("200");
    await expect(this.tokenContract.burn(burnAmount))
      .to.emit(this.tokenContract, "Transfer")
      .withArgs(this.owner.address, ethers.constants.AddressZero, burnAmount);
  });

  it("Should emit DestroyedBlackFunds event on destroying blacklisted user funds", async function () {
    const transferAmount = ethers.utils.parseEther("150");
    await this.tokenContract.transfer(this.user2.address, transferAmount);
    await this.tokenContract.blacklistAccount(this.user2.address, true);
    await expect(this.tokenContract.destroyBlackFunds(this.user2.address))
      .to.emit(this.tokenContract, "DestroyedBlackFunds")
      .withArgs(this.user2.address, transferAmount);
  });

});


describe("Ownable Contract Testing", () => {
  before(async function () {
    this.OwnableContract = await ethers.getContractFactory("Ownable");
  });

  beforeEach(async function () {
    this.ownableContract = await this.OwnableContract.deploy();
    await this.ownableContract.deployed();

    const signers = await ethers.getSigners();
    this.owner = signers[0];
    this.newOwner = signers[1];
    this.anotherOwner = signers[2];
    this.nonOwner = signers[3];

    this.ownerContract = this.ownableContract.connect(this.owner);
    this.newOwnerContract = this.ownableContract.connect(this.newOwner);
    this.anotherOwnerContract = this.ownableContract.connect(this.anotherOwner);
    this.nonOwnerContract = this.ownableContract.connect(this.nonOwner);
  });

  // Test cases

  it("Should set the deployer as the initial owner", async function () {
    const isOwner = await this.ownableContract.isOwner(this.owner.address);
    expect(isOwner).to.equal(true);
  });

  it("Should allow an owner to add another owner", async function () {
    await this.ownerContract.addOwner(this.newOwner.address);
    const isNewOwner = await this.ownableContract.isOwner(this.newOwner.address);
    expect(isNewOwner).to.equal(true);
  });

  it("Should not allow non-owners to add an owner", async function () {
    await expect(this.nonOwnerContract.addOwner(this.newOwner.address))
      .to.be.revertedWith("Available only for owners");
  });

  it("Should not allow adding the zero address as an owner", async function () {
    await expect(this.ownerContract.addOwner(ethers.constants.AddressZero))
      .to.be.revertedWith("New owner cannot be zero address");
  });

  it("Should not allow adding an address that is already an owner", async function () {
    await this.ownerContract.addOwner(this.newOwner.address);
    await expect(this.ownerContract.addOwner(this.newOwner.address))
      .to.be.revertedWith("Address is already an owner");
  });

  it("Should allow an owner to remove another owner", async function () {
    await this.ownerContract.addOwner(this.newOwner.address);
    await this.ownerContract.removeOwner(this.newOwner.address);
    const isNewOwner = await this.ownableContract.isOwner(this.newOwner.address);
    expect(isNewOwner).to.equal(false);
  });

  it("Should not allow an owner to remove themselves", async function () {
    await expect(this.ownerContract.removeOwner(this.owner.address))
      .to.be.revertedWith("Owners cannot remove themselves");
  });

  it("Should not allow removing a non-owner address", async function () {
    await expect(this.ownerContract.removeOwner(this.nonOwner.address))
      .to.be.revertedWith("Address is not an owner");
  });

  it("Should allow an owner to transfer ownership to another address", async function () {
    await this.ownerContract.transferOwnership(this.newOwner.address);
    const isOriginalOwner = await this.ownableContract.isOwner(this.owner.address);
    expect(isOriginalOwner).to.equal(false);
    const isNewOwner = await this.ownableContract.isOwner(this.newOwner.address);
    expect(isNewOwner).to.equal(true);
  });

  it("Should not allow transferring ownership to the zero address", async function () {
    await expect(this.ownerContract.transferOwnership(ethers.constants.AddressZero))
      .to.be.revertedWith("New owner cannot be zero address");
  });

  it("Should emit events when adding, removing, and transferring ownership", async function () {
    // Listen for events
    await expect(this.ownerContract.addOwner(this.newOwner.address))
      .to.emit(this.ownableContract, "OwnerAdded")
      .withArgs(this.newOwner.address);

    await expect(this.ownerContract.removeOwner(this.newOwner.address))
      .to.emit(this.ownableContract, "OwnerRemoved")
      .withArgs(this.newOwner.address);

    await expect(this.ownerContract.transferOwnership(this.newOwner.address))
      .to.emit(this.ownableContract, "OwnershipTransferred")
      .withArgs(this.owner.address, this.newOwner.address);
  });
});