# The Mine (for Adventurers)

Grab your pickaxe! The Mine is an open source area for Loot players to dig for rare ore and gems.

# Adventurers

Pack up your loot and hit the mines to start digging for rare ore and gems! 

## Who can play

All wallets holding Loot or mLoot can dig for treasure in The Mine once per day, per bag of Loot or mLoot. In The Mines, all players have an equal chance to get their hands dirty and labor for an in-game fortune!

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

TODO

# Future work

* The Forge (for Adventurers)
* Web interface for mining: mine button, display recharge time of each bag, display mining inventory

# Disclaimer

These smart contracts are being provided as is. No guarantee, representation or warranty is being made, express or implied, as to the safety or correctness of the the smart contracts. They have not been audited and as such there can be no assurance they will work as intended, and users may experience delays, failures, errors, omissions, loss of transmitted information or loss of funds. The author is not liable for any of the foregoing. Users should proceed with caution and use at their own risk.
