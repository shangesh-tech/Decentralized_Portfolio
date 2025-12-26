// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Web3Portfolio
 * @notice Decentralized portfolio system
 */
contract Web3Portfolio is Ownable, Pausable {
    uint256 public totalPortfolios;
    uint256 public totalDonations;

    struct Portfolio {
        address ethAddress;
        string ipfsDocumentHash;
        bool isPrivate;
        bool exists;
        uint256 createdAt;
        uint256 lastUpdated;
    }

    mapping(bytes32 => Portfolio) private portfolios;
    mapping(address => bytes32) private addressToUsername;

    event PortfolioCreated(address indexed owner, string userName);
    event PortfolioUpdated(address indexed owner, string userName);
    event PortfolioVisibilityUpdated(address indexed owner, string userName, bool isPrivate);
    event PortfolioDeleted(address indexed owner);
    event DonationReceived(address indexed donor, uint256 amount);
    event DonationWithdrawn(address indexed owner, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function _usernameHash(string calldata userName) internal pure returns (bytes32) {
        bytes32 hash;
        assembly {
            let len := userName.length
            let dataPtr := userName.offset
            hash := keccak256(dataPtr, len)
        }
        return hash;
    }

    function createPortfolio(
        string calldata userName,
        string calldata ipfsHash,
        bool isPrivate
    ) external whenNotPaused {
        require(bytes(userName).length > 0, "Username empty");
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");

        bytes32 userNameHash = _usernameHash(userName);
        address sender = msg.sender;

        require(!portfolios[userNameHash].exists, "Username taken");
        require(addressToUsername[sender] == bytes32(0), "Address already registered");

        portfolios[userNameHash] = Portfolio({
            ethAddress: sender,
            ipfsDocumentHash: ipfsHash,
            isPrivate: isPrivate,
            exists: true,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        addressToUsername[sender] = userNameHash;
        totalPortfolios++;

        emit PortfolioCreated(sender, userName);
    }

    function updatePortfolioHash(
        string calldata userName,
        string calldata newIpfsHash
    ) external whenNotPaused {
        bytes32 userNameHash = _usernameHash(userName);
        Portfolio storage p = portfolios[userNameHash];

        require(p.exists, "Portfolio not found");
        require(p.ethAddress == msg.sender, "Not portfolio owner");
        require(bytes(newIpfsHash).length > 0, "Invalid IPFS hash");

        if (keccak256(bytes(p.ipfsDocumentHash)) != keccak256(bytes(newIpfsHash))) {
            p.ipfsDocumentHash = newIpfsHash;
            p.lastUpdated = block.timestamp;
        }

        emit PortfolioUpdated(msg.sender, userName);
    }

    function updatePortfolioVisibility(
        string calldata userName,
        bool isPrivate
    ) external whenNotPaused {
        bytes32 userNameHash = _usernameHash(userName);
        Portfolio storage p = portfolios[userNameHash];

        require(p.exists, "Portfolio not found");
        require(p.ethAddress == msg.sender, "Not portfolio owner");

        if (p.isPrivate != isPrivate) {
            p.isPrivate = isPrivate;
            p.lastUpdated = block.timestamp;
        }

        emit PortfolioVisibilityUpdated(msg.sender, userName, isPrivate);
    }

    function deleteMyPortfolio() external whenNotPaused {
        bytes32 userNameHash = addressToUsername[msg.sender];
        require(userNameHash != bytes32(0), "Portfolio not found");

        delete portfolios[userNameHash];
        delete addressToUsername[msg.sender];
        totalPortfolios--;

        emit PortfolioDeleted(msg.sender);
    }

    function getMyPortfolio() external view returns (Portfolio memory) {
        bytes32 userNameHash = addressToUsername[msg.sender];
        require(userNameHash != bytes32(0), "Portfolio not found");
        return portfolios[userNameHash];
    }

    function getPortfolioByUsername(
        string calldata userName
    ) external view returns (Portfolio memory) {
        bytes32 userNameHash = _usernameHash(userName);
        Portfolio memory p = portfolios[userNameHash];

        require(p.exists, "Portfolio not found");

        if (p.isPrivate) {
            require(p.ethAddress == msg.sender, "Private portfolio");
        }

        return p;
    }

    function donate() external payable whenNotPaused {
        require(msg.value > 0, "Zero donation");
        totalDonations += msg.value;
        emit DonationReceived(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool ok, ) = owner().call{value: amount}("");
        require(ok, "Withdraw failed");
        emit DonationWithdrawn(owner(), amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {
        totalDonations += msg.value;
    }

    fallback() external payable {
        revert("Invalid call");
    }
}
