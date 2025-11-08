// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EduToken
 * @dev Educational platform token for staking and rewards
 */
contract EduToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("EduToken", "EDU") Ownable(initialOwner) {
        _mint(initialOwner, 1000000 * 10 ** decimals()); // Initial supply: 1 million tokens
    }

    /**
     * @dev Mint new tokens (only owner can mint)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
