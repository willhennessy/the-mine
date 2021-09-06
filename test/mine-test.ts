import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from 'hardhat';
import { Mine, Mine__factory } from "../artifacts/types/index";

// Explicitly require the HRE global variable to resolve type issue.
// https://hardhat.org/advanced/hardhat-runtime-environment.html#accessing-the-hre-from-outside-a-task
const hre = require("hardhat");

const NUM_ORES = 11;
const COAL = 10;
const LOOT_CONTRACT_ADDRESS = "0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7";
const mLOOT_CONTRACT_ADDRESS = "0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF";
const AGLD_GOVERNANCE_ADDR = "0xcD814C83198C15A542F9A13FAf84D518d1744ED1";

const ADDR_WITH_LOOT_AND_MLOOT = "0xb0623c91c65621df716ab8afe5f66656b21a9108";

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

async function mineFromAddress(mine: Mine, addr: string, loot: number) {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [addr],
  });

  const signer = await ethers.getSigner(addr); 
  const data = (await mine.mine(loot, LOOT_CONTRACT_ADDRESS)).data;

  console.log("signer addr:", signer.address);
  expect(
    await signer.sendTransaction({
      to: mine.address,
      from: signer.address,
      data: data,
    })
  ).to.emit(mine, 'TransferSingle');

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [ADDR_WITH_LOOT_AND_MLOOT],
  });
}

describe("Mine", function () {
  it("Should construct the contract with correct values and owner", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const Mine = await ethers.getContractFactory("Mine") as Mine__factory;
    const mine = await Mine.deploy() as Mine;
    await mine.deployed();

    expect(await mine.balanceOf(owner.address, 0)).to.equal(0);
    expect(await mine.owner()).to.equal(AGLD_GOVERNANCE_ADDR);
  });

  it("Should mine and log values", async function () {
    const addrs = await ethers.getSigners();
    const Mine = await ethers.getContractFactory("Mine") as Mine__factory;
    const mine = await Mine.deploy() as Mine;
    await mine.deployed();

    await mine.mineWithLoot(1);
    await mine.connect(addrs[1]).mineWithLoot(2);
    await mine.connect(addrs[2]).mineWithLoot(3);

    await logAccountBalances(mine, [addrs[0].address, addrs[1].address, addrs[2].address]);
  });

  /*
  it("Task: print aggregate result of 1000 mines", async function () {
    const addrs = await ethers.getSigners();
    const Mine = await ethers.getContractFactory("Mine") as Mine__factory;
    const mine = await Mine.deploy() as Mine;
    await mine.deployed();

    for (let i = 0; i < 1000; i++) {
      await mine.mineWithLoot(1);
    }
    await logAccountBalance(mine, addrs[0].address);
  });
  */

  it("Loot owner should be able to mine", async function () {
    const Mine = await ethers.getContractFactory("Mine") as Mine__factory;
    const mine = await Mine.deploy() as Mine;
    await mine.deployed();

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ADDR_WITH_LOOT_AND_MLOOT],
    });
  
    const signer = await ethers.getSigner(ADDR_WITH_LOOT_AND_MLOOT); 

    const functionParams = [
      7650,
      LOOT_CONTRACT_ADDRESS
    ];  
    const data = Mine.interface.encodeFunctionData("mine", functionParams);

    expect(
      await signer.sendTransaction({
        to: mine.address,
        from: signer.address,
        data: data,
      })
    ).to.emit(mine, 'TransferSingle');
  
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [ADDR_WITH_LOOT_AND_MLOOT],
    });

    // await mineFromAddress(mine, ADDR_WITH_LOOT_AND_MLOOT, 7650);
    
    await logAccountBalance(mine, ADDR_WITH_LOOT_AND_MLOOT);
    expect(await mine.balanceOf(ADDR_WITH_LOOT_AND_MLOOT, COAL))
      .to.be.above(BigNumber.from(0));
  });


  /*
  [TEST CASES to write]
  mine and mineWithLoot:
    loot and mLoot players are eligible immediately after constructor
    players specifying the loot and mLoot contract, but don't actually own item, are not eligible
    players specifying a non-whitelisted address are not eligible
    mining fails before recharge time has elapsed

  Governance Use Cases
    1. works from governance (emits events, then works)
    2. does not work from other addressess

    A. addEligibleBag
      i. subsequently mine() calls for that bag address work and are eligible
    B. setRechargeTime
    C. setCapacity
    D. addOreType
      i. subsequently, that ore actually appears upon mining (give high probability for test case)

  */
});
