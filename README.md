# The Mine (for Adventurers)

Grab your pickaxe! The Mine is an open source area for Loot players to dig for rare ore and gems.

# Adventurers

Pack up your loot and hit the mines to start digging for rare ore and gems! 

## Who can play

All wallets holding LOOT or mLOOT can dig for treasure in The Mine. All players have an equal chance to get their hands dirty and build an in-game fortune!

## How to play

1. Visit etherscan (deploy address TBD) and call the mine() function with your loot ID as a parameter
2. You will receive 8 random ores and gems ranging from common to rare (ERC-1155 tokens)
3. Each bag of Loot or mLoot may mine once per recharge period, which is currently 24hrs and configurable by AGLD Governance.

# Developers

**1. Install dependencies >** `yarn install`

**2. Compile the contracts >** `yarn hardhat compile`

**3. Run the unit tests >**

```
yarn hardhat node —fork <your_alchemy_project_key>
yarn hardhat test
```

**4. Deploy contracts >** `yarn hardhat run scripts/deploy.ts`

# Loot Governance

TODO
