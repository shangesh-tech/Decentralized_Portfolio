// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

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

    // usernameHash => portfolio
    mapping(bytes32 => Portfolio) private portfolios;

    // wallet => usernameHash
    mapping(address => bytes32) private addressToUsername;

    event PortfolioCreated(address indexed owner, string userName);
    event PortfolioUpdated(address indexed owner, string userName);
    event PortfolioVisibilityUpdated(address indexed owner, string userName, bool isPrivate);
    event DonationReceived(address indexed donor, uint256 amount);
    event DonationWithdrawn(address indexed owner, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function _usernameHash(string calldata userName) internal pure returns (bytes32) {
        return keccak256(bytes(userName));
    }

    function createPortfolio(string calldata _userName, string calldata _ipfsHash, bool _isPrivate)
        external
        whenNotPaused
    {
        require(bytes(_userName).length > 0, "Username empty");
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");

        bytes32 hash = _usernameHash(_userName);

        require(!portfolios[hash].exists, "Username taken");
        require(addressToUsername[msg.sender] == bytes32(0), "Address already has portfolio");

        portfolios[hash] = Portfolio({
            ethAddress: msg.sender,
            ipfsDocumentHash: _ipfsHash,
            isPrivate: _isPrivate,
            exists: true,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        addressToUsername[msg.sender] = hash;
        totalPortfolios++;

        emit PortfolioCreated(msg.sender, _userName);
    }

    function updatePortfolioHash(string calldata _userName, string calldata _newHash) external whenNotPaused {
        bytes32 hash = _usernameHash(_userName);
        Portfolio storage p = portfolios[hash];

        require(p.exists, "Portfolio not found");
        require(p.ethAddress == msg.sender, "Not portfolio owner");
        require(bytes(_newHash).length > 0, "Invalid IPFS hash");

        if (keccak256(bytes(p.ipfsDocumentHash)) != keccak256(bytes(_newHash))) {
            p.ipfsDocumentHash = _newHash;
            p.lastUpdated = block.timestamp;
        }

        emit PortfolioUpdated(msg.sender, _userName);
    }

    function updatePortfolioVisibility(string calldata _userName, bool _isPrivate) external whenNotPaused {
        bytes32 hash = _usernameHash(_userName);
        Portfolio storage p = portfolios[hash];

        require(p.exists, "Portfolio not found");
        require(p.ethAddress == msg.sender, "Not portfolio owner");

        if (p.isPrivate != _isPrivate) {
            p.isPrivate = _isPrivate;
            p.lastUpdated = block.timestamp;
        }

        emit PortfolioVisibilityUpdated(msg.sender, _userName, _isPrivate);
    }

    function getMyPortfolio() external view returns (Portfolio memory) {
        bytes32 hash = addressToUsername[msg.sender];
        require(hash != bytes32(0), "Portfolio not found");
        return portfolios[hash];
    }

    function getPortfolioByUsername(string calldata _userName) external view returns (Portfolio memory) {
        bytes32 hash = _usernameHash(_userName);
        Portfolio memory p = portfolios[hash];

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
        (bool ok,) = owner().call{value: amount}("");
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
