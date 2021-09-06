# The Mine (for Adventurers)

Grab your pickaxe! The Mine is an open source area for Loot players to dig for rare ore and gems.

# Adventurers

Pack up your loot and hit the mines to start digging for rare ore and gems! 

## Who can play

All wallets holding [Loot](https://etherscan.io/address/0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7) or [mLoot](https://etherscan.io/address/0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF) can dig for treasure in The Mine once per day, per bag of Loot or mLoot. In The Mines, all players have an equal chance to get their hands dirty and labor for an in-game fortune!

## How to play

1. Visit etherscan (deploy address TBD) and call the mine() function with your loot ID as a parameter
2. You will receive 8 random ores and gems ranging from common to rare (ERC-1155 tokens)
3. Each bag of Loot or mLoot may mine once per recharge period, which is currently 24hrs and configurable by AGLD Governance.

# Developers

**1. Install dependencies >** `yarn install`

**2. Compile the contracts >** `yarn hardhat compile`

**3. Run the unit tests >** ```yarn hardhat test```

**4. Deploy contracts >** `yarn hardhat run scripts/deploy.ts`

# Loot Governance

The Mine is governed by [AGLD](https://etherscan.io/address/0x32353a6c91143bfd6c7d363b546e62a9a2489a20#code) Governance. The following actions are available:

* `addEligibleBag(address bagAddress)` > add new ERC721 addresses to the list of addresses that are eligible to play in The Mine. Initially: [Loot](https://etherscan.io/address/0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7) and [mLoot](https://etherscan.io/address/0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF).
* `setRechargeTime(uint256 newRechargeTime)` > update the recharge time required between mines for a bag of loot. Initially: 86,400 (24hrs)
* `setCapacity(uint8 newCapacity)` > update the capacity of a miner's sack for each miner. Initially: 8 pieces per mine.
* `addOreType(string calldata newName, uint16 newChance, uint16 newAmountDivisor)` > create a new Ore or Gem type for Miners to discover!

# Future work

* The Forge (for Adventurers)
* Web interface for mining: mine button, display recharge time of each bag, display mining inventory

# Disclaimer

These smart contracts are being provided as is. No guarantee, representation or warranty is being made, express or implied, as to the safety or correctness of the the smart contracts. They have not been audited and as such there can be no assurance they will work as intended, and users may experience delays, failures, errors, omissions, loss of transmitted information or loss of funds. The author is not liable for any of the foregoing. Users should proceed with caution and use at their own risk.
