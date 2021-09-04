import { expect } from 'chai';
import { ethers } from 'hardhat';

describe("Mine", function () {
  it("Should construct the contract with initial values", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const Mine = await ethers.getContractFactory("Mine");
    const mine = await Mine.deploy();
    await mine.deployed();

    expect(await mine.balanceOf(owner.address, 0)).to.equal(7);
  });
});
