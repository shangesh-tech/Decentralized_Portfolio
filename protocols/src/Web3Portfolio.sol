// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title Web3Portfolio
 * @notice Decentralized portfolio system with meta-transaction support
 * @dev Inherits ERC2771Context for gasless transactions
 */
contract Web3Portfolio is ERC2771Context, Ownable, Pausable {
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
    event DonationReceived(address indexed donor, uint256 amount);
    event DonationWithdrawn(address indexed owner, uint256 amount);

    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) Ownable(msg.sender) {}

    function _usernameHash(string calldata userName) internal pure returns (bytes32) {
        bytes32 hash;
        assembly {
            let len := userName.length // 1) Read length directly from calldata
            let dataPtr := userName.offset // 2) Read pointer to bytes in calldata
            hash := keccak256(dataPtr, len) // 3) Hash that region in calldata
        }
        return hash;
    }

    function createPortfolio(string calldata _userName, string calldata _ipfsHash, bool _isPrivate)
        external
        whenNotPaused
    {
        require(bytes(_userName).length > 0, "Username empty");
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");

        bytes32 hash = _usernameHash(_userName);
        address sender = _msgSender();

        require(!portfolios[hash].exists, "Username taken");
        require(addressToUsername[sender] == bytes32(0), "Address already has portfolio");

        portfolios[hash] = Portfolio({
            ethAddress: sender,
            ipfsDocumentHash: _ipfsHash,
            isPrivate: _isPrivate,
            exists: true,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        addressToUsername[sender] = hash;
        totalPortfolios++;

        emit PortfolioCreated(sender, _userName);
    }

    function updatePortfolioHash(
        string calldata _userName,
        string calldata _newHash // ✅ FIXED: Removed "Context" typo
    )
        external
        whenNotPaused
    {
        bytes32 hash = _usernameHash(_userName);
        Portfolio storage p = portfolios[hash];
        address sender = _msgSender();

        require(p.exists, "Portfolio not found");
        require(p.ethAddress == sender, "Not portfolio owner");
        require(bytes(_newHash).length > 0, "Invalid IPFS hash");

        if (keccak256(bytes(p.ipfsDocumentHash)) != keccak256(bytes(_newHash))) {
            p.ipfsDocumentHash = _newHash;
            p.lastUpdated = block.timestamp;
        }

        emit PortfolioUpdated(sender, _userName);
    }

    function updatePortfolioVisibility(string calldata _userName, bool _isPrivate) external whenNotPaused {
        bytes32 hash = _usernameHash(_userName);
        Portfolio storage p = portfolios[hash];
        address sender = _msgSender();

        require(p.exists, "Portfolio not found");
        require(p.ethAddress == sender, "Not portfolio owner");

        if (p.isPrivate != _isPrivate) {
            p.isPrivate = _isPrivate;
            p.lastUpdated = block.timestamp;
        }

        emit PortfolioVisibilityUpdated(sender, _userName, _isPrivate);
    }

    function getMyPortfolio() external view returns (Portfolio memory) {
        address sender = _msgSender();
        bytes32 hash = addressToUsername[sender];
        require(hash != bytes32(0), "Portfolio not found");
        return portfolios[hash];
    }

    function getPortfolioByUsername(string calldata _userName) external view returns (Portfolio memory) {
        bytes32 hash = _usernameHash(_userName);
        Portfolio memory p = portfolios[hash];
        address sender = _msgSender();

        require(p.exists, "Portfolio not found");

        if (p.isPrivate) {
            require(p.ethAddress == sender, "Private portfolio");
        }

        return p;
    }

    function donate() external payable whenNotPaused {
        require(msg.value > 0, "Zero donation");
        totalDonations += msg.value;
        emit DonationReceived(_msgSender(), msg.value);
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

    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view virtual override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}
