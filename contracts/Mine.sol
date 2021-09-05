//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Mine is ERC1155, ReentrancyGuard {
    /** Ores & Gems */
    uint256 public constant DIAMOND = 0;
    uint256 public constant RUBY = 1;
    uint256 public constant EMERALD = 2;
    uint256 public constant SAPPHIRE = 3;
    uint256 public constant BUTERINIUM = 4;
    uint256 public constant CALAMITITE = 5;
    uint256 public constant TRILLIUM = 6;
    uint256 public constant MITHRIL = 7;
    uint256 public constant PYRITE = 8;
    uint256 public constant IRON = 9;
    uint256 public constant COAL = 10;

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

    uint16 private STEP = 10**3;

    // TODO: look into 1155 URIs
    constructor() public ERC1155("https://game.example/api/item/{id}.json") {
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
        return uint256(keccak256(abi.encodePacked(input)));
    }

    function _mine(uint256 loot) internal {
        uint8 capacity = 8;

        uint256 rand = random(string(abi.encodePacked(loot)));
        console.log("rand:", rand);
        uint8 index = 0;

        while (capacity > 0) {
            uint16 haul = uint16(rand % STEP);
            console.log("haul:", haul);

            if (index == DIAMOND && haul < 1) {
                _mint(msg.sender, DIAMOND, 1, "");
                capacity = capacity - 1;
            } else if (index == RUBY && haul < 10) {
                _mint(msg.sender, RUBY, 1, "");
                capacity = capacity - 1;
            } else if (index == EMERALD && haul < 50) {
                _mint(msg.sender, EMERALD, 1, "");
                capacity = capacity - 1;
            } else if (index == SAPPHIRE && haul < 80) {
                _mint(msg.sender, SAPPHIRE, 1, "");
                capacity = capacity - 1;
            } else if (index == BUTERINIUM && haul < 10) {
                _mint(msg.sender, BUTERINIUM, 1, "");
                capacity = capacity - 1;
            } else if (index == CALAMITITE && haul < 50) {
                _mint(msg.sender, CALAMITITE, 1, "");
                capacity = capacity - 1;
            } else if (index == TRILLIUM && haul < 100) {
                _mint(msg.sender, TRILLIUM, 1, "");
                capacity = capacity - 1;
            } else if (index == PYRITE && haul < 250) {
                _mint(msg.sender, PYRITE, 1, "");
                capacity = capacity - 1;
            } else if (index == MITHRIL && haul < 400) {
                _mint(msg.sender, MITHRIL, 1, "");
                capacity = capacity - 1;
            } else if (index == IRON && haul < 601) {
                uint8 amount = min(uint8(haul / 200), capacity);
                _mint(msg.sender, IRON, amount, "");
                capacity = capacity - amount;
            } else if (index == COAL) {
                _mint(msg.sender, COAL, capacity, "");
                capacity = 0;
            }

            rand = rand / STEP;
            index = index + 1;
        }
    }

    function mine(uint256 loot) public nonReentrant {
        // TODO: support mLoot's ever-increasing token ID
        require(loot > 0 && loot < 8001, "Token ID invalid");

        // TODO: require that msg.sender is the owner of lootId

        _mine(loot);
    }

    /// @notice returns the minimum of a or b
    function min(uint8 a, uint8 b) internal pure returns (uint8) {
        return a < b ? a : b;
    }
}
