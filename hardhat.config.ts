import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import { task } from "hardhat/config";


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 export default {
  solidity: "0.8.4",
  typechain: {
    outDir: 'artifacts/types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ['externalArtifacts/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },
  networks: {
    hardhat: {
      forking: {
        // personal Alchemy key; please don't abuse; it will hit daily cap
        url: "https://eth-mainnet.alchemyapi.io/v2/x__HXqJgEN47SKwQOEvMo5GjBpzZJCHo"
      }
    }
  }
};
