// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";

/**
 * @title MinimalForwarder
 * @notice Trusted forwarder for gasless transactions
 * @dev Production-ready wrapper around OpenZeppelin's ERC2771Forwarder
 */
contract TrustedForwarder is ERC2771Forwarder {
    constructor(string memory name) ERC2771Forwarder(name) {}
}
