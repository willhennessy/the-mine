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
const INELIGIBLE_CONTRACT_ADDRESS = "0xc00e94cb662c3520282e6f5717214004a7f26888";
const AGLD_GOVERNANCE_ADDR = "0xcD814C83198C15A542F9A13FAf84D518d1744ED1";

const ADDR_WITH_NO_LOOT = "0x04196627190ff624492427217d853deaa270f9d2";
const ADDR_WITH_LOOT_AND_MLOOT = "0xb0623c91c65621df716ab8afe5f66656b21a9108";
const LOOT_ID = 7650;
const mLOOT_ID = 12344;
/** Warning: the above constants assume that ADDR_WITH_LOOT_AND_MLOOT
    truly owns LOOT_ID and mLOOT_ID on the mainnet fork. This could change
    at any time and cause tests to fail. (but he has diamond hands) **/

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

async function mineFromAddress(mineFactory: Mine__factory, mine: Mine, sender: string, loot: number, bagAddress: string) {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [sender],
  });

  const signer = await ethers.getSigner(sender); 

  // build the TransactionRequest.data parameter
  const functionParams = [
    loot,
    bagAddress
  ];  
  const data = mineFactory.interface.encodeFunctionData("mine", functionParams);

  await expect(
    signer.sendTransaction({
      to: mine.address,
      from: signer.address,
      data: data,
    })
  ).to.emit(mine, 'TransferSingle');

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [sender],
  });
}

async function mineWithLootFromAddress(mineFactory: Mine__factory, mine: Mine, sender: string, loot: number) {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [sender],
  });

  const signer = await ethers.getSigner(sender); 

  // build the TransactionRequest.data parameter
  const functionParams = [
    loot
  ];  
  const data = mineFactory.interface.encodeFunctionData("mineWithLoot", functionParams);

  await expect(
    signer.sendTransaction({
      to: mine.address,
      from: signer.address,
      data: data,
    })
  ).to.emit(mine, 'TransferSingle');

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [sender],
  });
}

describe("Mine", function () {
  /** Deploy Test Cases **/
  describe("Deploy Test Cases", function () {
    it("Should construct the contract with correct values and owner", async function () {
      const [owner, addr1] = await ethers.getSigners();
      const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
      const mine = await mineFactory.deploy() as Mine;
      await mine.deployed();

      expect(await mine.balanceOf(owner.address, 0)).to.equal(0);
      expect(await mine.owner()).to.equal(AGLD_GOVERNANCE_ADDR);
    });

    it("Should mine and log values", async function () {
      const addrs = await ethers.getSigners();
      const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
      const mine = await mineFactory.deploy() as Mine;
      await mine.deployed();

      await mineWithLootFromAddress(mineFactory, mine, ADDR_WITH_LOOT_AND_MLOOT, LOOT_ID);
      await mineWithLootFromAddress(mineFactory, mine, ADDR_WITH_LOOT_AND_MLOOT, mLOOT_ID);

      await logAccountBalance(mine, ADDR_WITH_LOOT_AND_MLOOT);
    });
  });

  /** Mine(Loot) Test Cases **/
  describe("Mine(Loot) Test Cases", function () {
    it("Loot owner should be able to mine", async function () {
      const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
      const mine = await mineFactory.deploy() as Mine;
      await mine.deployed();

      await mineFromAddress(mineFactory, mine, ADDR_WITH_LOOT_AND_MLOOT, LOOT_ID, LOOT_CONTRACT_ADDRESS);
      
      await logAccountBalance(mine, ADDR_WITH_LOOT_AND_MLOOT);
      expect(await mine.balanceOf(ADDR_WITH_LOOT_AND_MLOOT, COAL))
        .to.be.above(BigNumber.from(0));
    });

    it("Loot owner should NOT be able to mine with the same bag before recharge time", async function () {
      const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
      const mine = await mineFactory.deploy() as Mine;
      await mine.deployed();

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [ADDR_WITH_LOOT_AND_MLOOT],
      });

      const signer = await ethers.getSigner(ADDR_WITH_LOOT_AND_MLOOT); 

      // build the TransactionRequest.data parameter
      const functionParams = [
        LOOT_ID,
        LOOT_CONTRACT_ADDRESS
      ];  
      const data = mineFactory.interface.encodeFunctionData("mine", functionParams);

      // first mine should succeed
      await expect(
        signer.sendTransaction({
          to: mine.address,
          from: signer.address,
          data: data,
        })
      ).to.emit(mine, 'TransferSingle');

      // second mine should fail
      await expect(
        signer.sendTransaction({
          to: mine.address,
          from: signer.address,
          data: data,
        })
      ).to.be.revertedWith('Bag is recharging');    

      await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [ADDR_WITH_LOOT_AND_MLOOT],
      });
    });

    it("Non-loot owner should NOT be able to mine", async function () {
      const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
      const mine = await mineFactory.deploy() as Mine;
      await mine.deployed();

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [ADDR_WITH_NO_LOOT],
      });

      const signer = await ethers.getSigner(ADDR_WITH_NO_LOOT); 

      // build the TransactionRequest.data parameter
      const functionParams = [
        1000,
        LOOT_CONTRACT_ADDRESS
      ];  
      const data = mineFactory.interface.encodeFunctionData("mine", functionParams);

      await expect(
        signer.sendTransaction({
          to: mine.address,
          from: signer.address,
          data: data,
        })
      ).to.be.revertedWith('Sender does not own item ID');    

      await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [ADDR_WITH_NO_LOOT],
      });
    });

    it("Sender should NOT be able to mine with ineligible bag address", async function () {
      const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
      const mine = await mineFactory.deploy() as Mine;
      await mine.deployed();

      await expect(mine.mine(1000, INELIGIBLE_CONTRACT_ADDRESS))
        .to.be.revertedWith("Bag address is not eligible");
    });

    it("Loot owner should be able to mine", async function () {
      const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
      const mine = await mineFactory.deploy() as Mine;
      await mine.deployed();

      await mineFromAddress(mineFactory, mine, ADDR_WITH_LOOT_AND_MLOOT, LOOT_ID, LOOT_CONTRACT_ADDRESS);
      
      await logAccountBalance(mine, ADDR_WITH_LOOT_AND_MLOOT);
      expect(await mine.balanceOf(ADDR_WITH_LOOT_AND_MLOOT, COAL))
        .to.be.above(BigNumber.from(0));
    });
  });
  
  /** Mine(mLoot) Test Cases **/
  describe("Mine(mLoot) Test Cases", function () {
    it("mLoot owner should be able to mine", async function () {
      const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
      const mine = await mineFactory.deploy() as Mine;
      await mine.deployed();

      await mineFromAddress(mineFactory, mine, ADDR_WITH_LOOT_AND_MLOOT, mLOOT_ID, mLOOT_CONTRACT_ADDRESS);
      
      await logAccountBalance(mine, ADDR_WITH_LOOT_AND_MLOOT);
      expect(await mine.balanceOf(ADDR_WITH_LOOT_AND_MLOOT, COAL))
        .to.be.above(BigNumber.from(0));
    });

    it("mLoot owner should NOT be able to mine with the same bag before recharge time", async function () {
      const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
      const mine = await mineFactory.deploy() as Mine;
      await mine.deployed();

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [ADDR_WITH_LOOT_AND_MLOOT],
      });

      const signer = await ethers.getSigner(ADDR_WITH_LOOT_AND_MLOOT); 

      // build the TransactionRequest.data parameter
      const functionParams = [
        mLOOT_ID,
        mLOOT_CONTRACT_ADDRESS
      ];  
      const data = mineFactory.interface.encodeFunctionData("mine", functionParams);

      // first mine should succeed
      await expect(
        signer.sendTransaction({
          to: mine.address,
          from: signer.address,
          data: data,
        })
      ).to.emit(mine, 'TransferSingle');

      // second mine should fail
      await expect(
        signer.sendTransaction({
          to: mine.address,
          from: signer.address,
          data: data,
        })
      ).to.be.revertedWith('Bag is recharging');    

      await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [ADDR_WITH_LOOT_AND_MLOOT],
      });
    });

    it("Non-mLoot owner should NOT be able to mine", async function () {
      const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
      const mine = await mineFactory.deploy() as Mine;
      await mine.deployed();

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [ADDR_WITH_NO_LOOT],
      });

      const signer = await ethers.getSigner(ADDR_WITH_NO_LOOT); 

      // build the TransactionRequest.data parameter
      const functionParams = [
        mLOOT_ID,
        mLOOT_CONTRACT_ADDRESS
      ];  
      const data = mineFactory.interface.encodeFunctionData("mine", functionParams);

      await expect(
        signer.sendTransaction({
          to: mine.address,
          from: signer.address,
          data: data,
        })
      ).to.be.revertedWith('Sender does not own item ID');    

      await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [ADDR_WITH_NO_LOOT],
      });
    });

    it("Sender should NOT be able to mine with ineligible bag address", async function () {
      const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
      const mine = await mineFactory.deploy() as Mine;
      await mine.deployed();

      await expect(mine.mine(20000, INELIGIBLE_CONTRACT_ADDRESS))
        .to.be.revertedWith("Bag address is not eligible");
    });
  });

    /** MineWithLoot(Loot) Test Cases **/
    describe("MineWithLoot(Loot) Test Cases", function () {
      it("Loot owner should be able to mineWithLoot(Loot)", async function () {
        const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
        const mine = await mineFactory.deploy() as Mine;
        await mine.deployed();
  
        await mineWithLootFromAddress(mineFactory, mine, ADDR_WITH_LOOT_AND_MLOOT, LOOT_ID);
        
        await logAccountBalance(mine, ADDR_WITH_LOOT_AND_MLOOT);
        expect(await mine.balanceOf(ADDR_WITH_LOOT_AND_MLOOT, COAL))
          .to.be.above(BigNumber.from(0));
      });
  
      it("Loot owner should NOT be able to mineWithLoot with the same bag before recharge time", async function () {
        const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
        const mine = await mineFactory.deploy() as Mine;
        await mine.deployed();
  
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [ADDR_WITH_LOOT_AND_MLOOT],
        });
  
        const signer = await ethers.getSigner(ADDR_WITH_LOOT_AND_MLOOT); 
  
        // build the TransactionRequest.data parameter
        const functionParams = [
          LOOT_ID
        ];  
        const data = mineFactory.interface.encodeFunctionData("mineWithLoot", functionParams);
  
        // first mine should succeed
        await expect(
          signer.sendTransaction({
            to: mine.address,
            from: signer.address,
            data: data,
          })
        ).to.emit(mine, 'TransferSingle');
  
        // second mine should fail
        await expect(
          signer.sendTransaction({
            to: mine.address,
            from: signer.address,
            data: data,
          })
        ).to.be.revertedWith('Bag is recharging');    
  
        await hre.network.provider.request({
          method: "hardhat_stopImpersonatingAccount",
          params: [ADDR_WITH_LOOT_AND_MLOOT],
        });
      });
  
      it("Non-Loot owner should NOT be able to mine", async function () {
        const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
        const mine = await mineFactory.deploy() as Mine;
        await mine.deployed();
  
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [ADDR_WITH_NO_LOOT],
        });
  
        const signer = await ethers.getSigner(ADDR_WITH_NO_LOOT); 
  
        // build the TransactionRequest.data parameter
        const functionParams = [
          LOOT_ID
        ];  
        const data = mineFactory.interface.encodeFunctionData("mineWithLoot", functionParams);
  
        await expect(
          signer.sendTransaction({
            to: mine.address,
            from: signer.address,
            data: data,
          })
        ).to.be.revertedWith('Sender does not own item ID');    
  
        await hre.network.provider.request({
          method: "hardhat_stopImpersonatingAccount",
          params: [ADDR_WITH_NO_LOOT],
        });
      });
    });

    /** MineWithLoot(mLoot) Test Cases **/
    describe("MineWithLoot(mLoot) Test Cases", function () {
      it("mLoot owner should be able to mineWithLoot(mLoot)", async function () {
        const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
        const mine = await mineFactory.deploy() as Mine;
        await mine.deployed();
  
        await mineWithLootFromAddress(mineFactory, mine, ADDR_WITH_LOOT_AND_MLOOT, mLOOT_ID);
        
        await logAccountBalance(mine, ADDR_WITH_LOOT_AND_MLOOT);
        expect(await mine.balanceOf(ADDR_WITH_LOOT_AND_MLOOT, COAL))
          .to.be.above(BigNumber.from(0));
      });
  
      it("mLoot owner should NOT be able to mineWithLoot with the same bag before recharge time", async function () {
        const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
        const mine = await mineFactory.deploy() as Mine;
        await mine.deployed();
  
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [ADDR_WITH_LOOT_AND_MLOOT],
        });
  
        const signer = await ethers.getSigner(ADDR_WITH_LOOT_AND_MLOOT); 
  
        // build the TransactionRequest.data parameter
        const functionParams = [
          mLOOT_ID
        ];  
        const data = mineFactory.interface.encodeFunctionData("mineWithLoot", functionParams);
  
        // first mine should succeed
        await expect(
          signer.sendTransaction({
            to: mine.address,
            from: signer.address,
            data: data,
          })
        ).to.emit(mine, 'TransferSingle');
  
        // second mine should fail
        await expect(
          signer.sendTransaction({
            to: mine.address,
            from: signer.address,
            data: data,
          })
        ).to.be.revertedWith('Bag is recharging');    
  
        await hre.network.provider.request({
          method: "hardhat_stopImpersonatingAccount",
          params: [ADDR_WITH_LOOT_AND_MLOOT],
        });
      });
  
      it("Non-mLoot owner should NOT be able to mine", async function () {
        const mineFactory = await ethers.getContractFactory("Mine") as Mine__factory;
        const mine = await mineFactory.deploy() as Mine;
        await mine.deployed();
  
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [ADDR_WITH_NO_LOOT],
        });
  
        const signer = await ethers.getSigner(ADDR_WITH_NO_LOOT); 
  
        // build the TransactionRequest.data parameter
        const functionParams = [
          mLOOT_ID
        ];  
        const data = mineFactory.interface.encodeFunctionData("mineWithLoot", functionParams);
  
        await expect(
          signer.sendTransaction({
            to: mine.address,
            from: signer.address,
            data: data,
          })
        ).to.be.revertedWith('Sender does not own item ID');    
  
        await hre.network.provider.request({
          method: "hardhat_stopImpersonatingAccount",
          params: [ADDR_WITH_LOOT_AND_MLOOT],
        });
      });
    });


  /*
  [TODO: TEST CASES]

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
});
