//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Mine is ERC1155, Ownable, ReentrancyGuard {
    address public constant lootContractAddress =
        0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7;
    address public constant mLootContractAddress =
        0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF;

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

    /// @notice Mapping of item contract addresses
    /// if true, wallets holding an item frmo this bag are eligible to mine */
    mapping(address => bool) private eligibleBags;

    /// @notice record of the last timestamp each loot bag mined
    mapping(address => mapping(uint256 => uint256)) private lastMinedTime;

    /// @notice the minimum recharge time necessary between each mine, per loot bag
    uint256 private RECHARGE_TIME = 86400;

    /// @notice the number of Ore or Gems a miner will receive from a single mine
    uint8 private CAPACITY = 8;

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

    uint16 private STEP = 10**3;

    event EligibleBagAdded(address indexed bagAddress);
    event CapacityUpdated(uint8 indexed capacity);
    event RechargeTimeUpdated(uint256 indexed rechargeTime);
    event OreTypeAdded(string name, uint16 chance, uint16 amountDivisor);

    constructor()
        Ownable()
        ERC1155("https://lootproject.com/api/mine/{id}.json")
    {
        eligibleBags[lootContractAddress] = true;
        eligibleBags[mLootContractAddress] = true;

        // Transfer ownership to the Loot DAO
        transferOwnership(0xcD814C83198C15A542F9A13FAf84D518d1744ED1);

        // _mint(msg.sender, DIAMOND, 1, "");
    }

    function random(string memory input) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(input)));
    }

    function _mine(uint256 itemId, address bagAddress) internal {
        lastMinedTime[bagAddress][itemId] = block.timestamp;
        uint8 capacity = CAPACITY;
        uint256 rand = random(
            string(
                abi.encodePacked(
                    block.timestamp,
                    blockhash(block.number - 1),
                    itemId
                )
            )
        );

        uint8 index = 0;
        while (capacity > 0 && index < names.length) {
            uint16 haul = uint16(rand % STEP);
            //console.log("haul:", index, haul);

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

    /// @notice mine for ore and gems using your loot bag up to once per recharge period.
    /// @param itemId the ID of the loot within the bagAddress contract
    /// @param bagAddress the address of the loot bag contract
    function mine(uint256 itemId, address bagAddress) external nonReentrant {
        require(eligibleBags[bagAddress], "Bag address is not eligible");
        require(
            msg.sender == IERC721(bagAddress).ownerOf(itemId),
            "Sender does not own item ID"
        );
        require(
            block.timestamp > lastMinedTime[bagAddress][itemId] + RECHARGE_TIME,
            "Bag is recharging"
        );
        _mine(itemId, bagAddress);
    }

    /// @notice convenience function for holders of original Loot and mLoot
    /// @param loot: the ID of your loot (0,8001) or mLoot (8000+)
    function mineWithLoot(uint256 loot) external nonReentrant {
        if (loot > 0 && loot < 8001) {
            // require(
            //     msg.sender == IERC721(lootContractAddress).ownerOf(loot),
            //     "Sender does not own item ID"
            // );
            // require(block.timestamp > lastMinedTime[lootContractAddress][itemId] + RECHARGE_TIME);
            _mine(loot, lootContractAddress);
        } else if (loot > 8000 && loot < (block.number / 10) + 1) {
            // require(
            //     msg.sender == IERC721(mLootContractAddress).ownerOf(loot),
            //     "Sender does not own item ID"
            // );
            // require(block.timestamp > lastMinedTime[mLootContractAddress][itemId] + RECHARGE_TIME);
            _mine(loot, mLootContractAddress);
        }
    }

    /// @notice returns the minimum of a or b
    function min(uint8 a, uint8 b) internal pure returns (uint8) {
        return a < b ? a : b;
    }

    function addEligibleBag(address bagAddress) public onlyOwner {
        // TODO: require the address is an NFT so it won't break the code
        eligibleBags[bagAddress] = true;
        emit EligibleBagAdded(bagAddress);
    }

    function setRechargeTime(uint256 newRechargeTime) public onlyOwner {
        RECHARGE_TIME = newRechargeTime;
        emit RechargeTimeUpdated(newRechargeTime);
    }

    function setCapacity(uint8 newCapacity) public onlyOwner {
        CAPACITY = newCapacity;
        emit CapacityUpdated(newCapacity);
    }

    function addOreType(
        string calldata newName,
        uint16 newChance,
        uint16 newAmountDivisor
    ) public onlyOwner {
        require(newChance > 0, "Chance cannot be zero");
        require(newAmountDivisor > 0, "amountDivisor cannot be zero");

        names.push(newName);
        chance.push(newChance);
        amountDivisor.push(newAmountDivisor);
        emit OreTypeAdded(newName, newChance, newAmountDivisor);
    }
}
