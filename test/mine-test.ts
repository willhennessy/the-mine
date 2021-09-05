import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Mine, Mine__factory } from "../artifacts/types/index";

const NUM_ORES = 11;

/// Get the ore & gem balance for a single address
async function getBalances(mine: Mine, address: string) {
  const addrs = Array(NUM_ORES).fill(address);
  const ids = Array.from(Array(NUM_ORES).keys());
  const balances = await mine.balanceOfBatch(addrs, ids);
  const oreNames = await getOreNames(mine);
  let output: { [name: string]: string } = {};
  for (let i = 0; i < balances.length; i++) {
    output[oreNames[i]] = balances[i].toString();
  }
  return output;
}

/// Get list of all ore names
async function getOreNames(mine: Mine): Promise<string[]> {
  var oreNames = Array();
  for (let ore = 0; ore < NUM_ORES; ore++) {
    oreNames.push(await mine.names(ore));
  }
  return oreNames;
}

/// Print the ore & gem balance for all `addresses`
async function logAccountBalances(mine: Mine, addresses: string[]) {
  var output = Array();
  for (let i = 0; i < addresses.length; i++) {
    let balanceRow = await getBalances(mine, addresses[i]);
    output.push(balanceRow);
  }
  console.table(output);
}

/// Prints all ore & gem balances for a single account `address`
async function logAccountBalance(mine: Mine, address: string) {
  console.table(await getBalances(mine, address));
}

describe("Mine", function () {
  it("Should construct the contract with initial values", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const Mine = await ethers.getContractFactory("Mine") as Mine__factory;
    const mine = await Mine.deploy() as Mine;
    await mine.deployed();

    expect(await mine.balanceOf(owner.address, 0)).to.equal(1);
  });

  it("Should mine and log values", async function () {
    const addrs = await ethers.getSigners();
    const Mine = await ethers.getContractFactory("Mine") as Mine__factory;
    const mine = await Mine.deploy() as Mine;
    await mine.deployed();

    await mine.mineWithLoot(1);
    await mine.connect(addrs[1]).mineWithLoot(2);
    await mine.connect(addrs[2]).mineWithLoot(3);

    logAccountBalances(mine, [addrs[0].address, addrs[1].address, addrs[2].address]);
  });
});
