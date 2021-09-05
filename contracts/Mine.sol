//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Mine is ERC1155, ReentrancyGuard {
    IERC721 immutable lootContract;
    IERC721 immutable mLootContract;

    /** Ores & Gems */
    uint256 public constant DIAMOND = 0x0;
    uint256 public constant RUBY = 0x1;
    uint256 public constant EMERALD = 0x2;
    uint256 public constant SAPPHIRE = 0x3;
    uint256 public constant BUTERINIUM = 0x4;
    uint256 public constant CALAMITITE = 0x5;
    uint256 public constant TRILLIUM = 0x6;
    uint256 public constant MITHRIL = 0x7;
    uint256 public constant PYRITE = 0x8;
    uint256 public constant IRON = 0x9;
    uint256 public constant COAL = 0xA;
    // note: if new ores are added they will not receive a public constant

    /** Display name of Ores & Gems */
    string[] public names = [
        "Diamond",
        "Ruby",
        "Emerald",
        "Sapphire",
        "Buterinium Ore",
        "Calamitite Ore",
        "Trillium Ore",
        "Mithril Ore",
        "Pyrite Ore",
        "Iron Ore",
        "Coal"
    ];

    /// @notice record of the last timestamp each loot bag mined
    mapping(uint256 => uint256) public lastMinedTime;

    /// @notice the minimum recharge time necessary between each mine, per loot bag
    uint256 public RECHARGE_TIME = 86400;

    /// @notice the number of Ore or Gems a miner will receive from a single mine
    uint8 public CAPACITY = 8;

    /** Probability of Ores & Gems (out of 1000) */
    uint16[] private chance = [
        1, // "Diamond"
        10, // "Ruby"
        50, // "Emerald"
        80, // "Sapphire"
        10, // "Buterinium Ore"
        50, // "Calamitite Ore"
        100, // "Trillium Ore"
        250, // "Mithril Ore"
        400, // "Pyrite Ore"
        600, // "Iron Ore"
        1000 // "Coal"
    ];

    /** Probability of Ores & Gems (out of 1000) */
    uint16[] private amountDivisor = [
        1, // "Diamond"
        10, // "Ruby"
        50, // "Emerald"
        80, // "Sapphire"
        10, // "Buterinium Ore"
        25, // "Calamitite Ore"
        50, // "Trillium Ore"
        125, // "Mithril Ore"
        200, // "Pyrite Ore"
        200, // "Iron Ore"
        1000 // "Coal"
    ];

    /** Probability of Ores & Gems (out of 1000) */
    address[] private eligibleBags = [
        0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7, // Loot (original)
        0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF // mLoot
    ];

    uint16 private STEP = 10**3;

    event EligibleBagAdded(address indexed bagAddress);
    event CapacityUpdated(uint8 indexed capacity);
    event RechargeTimeUpdated(uint256 indexed rechargeTime);
    event OreTypeAdded(string name, uint16 chance, uint16 amountDivisor);

    // TODO: look into 1155 URIs
    constructor() public ERC1155("https://game.example/api/item/{id}.json") {
        lootContract = IERC721(eligibleBags[0]);
        mLootContract = IERC721(eligibleBags[1]);

        _mint(msg.sender, DIAMOND, 1, "");
        // _mint(msg.sender, RUBY, 1, "");
        // _mint(msg.sender, EMERALD, 1, "");
        // _mint(msg.sender, SAPPHIRE, 1, "");
        // _mint(msg.sender, BUTERINIUM, 1, "");
        // _mint(msg.sender, CALAMITITE, 1, "");
        // _mint(msg.sender, TRILLIUM, 1, "");
        // _mint(msg.sender, MITHRIL, 1, "");
        // _mint(msg.sender, PYRITE, 1, "");
        // _mint(msg.sender, IRON, 1, "");
        // _mint(msg.sender, COAL, 1, "");
    }

    function random(string memory input) internal pure returns (uint256) {
        //return uint256(keccak256(abi.encodePacked(block.basefee, blockhash(block.number-1), msg.sender, input)));
        return uint256(keccak256(abi.encodePacked(input)));
    }

    function _mine(uint256 loot) internal {
        uint8 capacity = CAPACITY;
        uint256 rand = random(
            string(
                abi.encodePacked(
                    block.timestamp,
                    blockhash(block.number - 1),
                    loot
                )
            )
        );

        uint8 index = 0;
        while (capacity > 0 && index < names.length) {
            uint16 haul = uint16(rand % STEP);
            console.log("haul:", index, haul);

            if (index != COAL && haul < chance[index]) {
                uint8 amount = min(
                    uint8(haul / amountDivisor[index]) + 1,
                    capacity
                );
                _mint(msg.sender, index, amount, "");
                capacity = capacity - amount;
            }

            rand = rand / STEP;
            index = index + 1;
        }
        // finally, fill all remaining slots with coal
        _mint(msg.sender, COAL, capacity, "");
    }

    function mine(uint256 loot) public nonReentrant {
        // require(isEligiblePlayer(loot), "Sender does not own eligible loot");
        // require(block.timestamp > lastMinedTime[loot] + RECHARGE_TIME);
        _mine(loot);
        lastMinedTime[loot] = block.timestamp;
    }

    /// @notice returns the minimum of a or b
    function min(uint8 a, uint8 b) internal pure returns (uint8) {
        return a < b ? a : b;
    }

    function addEligibleBag(address bagAddress) public {
        // TODO: restrict to governance contract only
        // TODO: require the address is an NFT and won't break the code
        eligibleBags.push(bagAddress);
        emit EligibleBagAdded(bagAddress);
    }

    function setRechargeTime(uint256 newRechargeTime) public {
        // TODO: restrict to governance contract only
        // TODO: require the address is an NFT and won't break the code
        RECHARGE_TIME = newRechargeTime;
        emit RechargeTimeUpdated(newRechargeTime);
    }

    function setCapacity(uint8 newCapacity) public {
        // TODO: restrict to governance contract only
        // TODO: require the address is an NFT and won't break the code
        CAPACITY = newCapacity;
        emit CapacityUpdated(newCapacity);
    }

    function addOreType(
        string calldata newName,
        uint16 newChance,
        uint16 newAmountDivisor
    ) public {
        require(newChance > 0, "Chance cannot be zero");
        require(newAmountDivisor > 0, "amountDivisor cannot be zero");

        // TODO: restrict to governance contract only

        names.push(newName);
        chance.push(newChance);
        amountDivisor.push(newAmountDivisor);
        emit OreTypeAdded(newName, newChance, newAmountDivisor);
    }

    /// @notice returns true if msg.sender owns the specified loot bag
    function isEligiblePlayer(uint256 loot) public view returns (bool) {
        if (loot > 0 && loot < 8001) {
            if (msg.sender == lootContract.ownerOf(loot)) {
                return true;
            }
        } else if (loot > 8000 && loot < (block.number / 10) + 1) {
            if (msg.sender == mLootContract.ownerOf(loot)) {
                return true;
            }
        }
        return false;
    }
}
