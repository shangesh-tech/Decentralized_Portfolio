// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {Web3Portfolio} from "../src/Web3Portfolio.sol";
import {TrustedForwarder} from "../src/TrustedForwarder.sol";
import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";

contract Web3PortfolioTest is Test {
    Web3Portfolio portfolio;
    TrustedForwarder forwarder;

    address owner = address(0x1);
    address alice = address(0x2);
    address bob = address(0x3);

    function setUp() public {
        // STEP 1: Deploy YOUR forwarder
        forwarder = new TrustedForwarder("Web3PortfolioForwarder");

        // STEP 2: Deploy portfolio with forwarder address
        vm.prank(owner);
        portfolio = new Web3Portfolio(address(forwarder));
    }

    // DEPLOYMENT
    function testOwnerIsSetCorrectly() public view {
        assertEq(portfolio.owner(), owner);
    }

    function testInitialCountersAreZero() public view {
        assertEq(portfolio.totalPortfolios(), 0);
        assertEq(portfolio.totalDonations(), 0);
    }

    // Verify forwarder is trusted
    function testForwarderIsTrusted() public view {
        assertTrue(portfolio.isTrustedForwarder(address(forwarder)));
    }

    // CREATE PORTFOLIO
    function testCreatePortfolioSuccess() public {
        vm.prank(alice);
        portfolio.createPortfolio("alice", "QmHash", false);

        Web3Portfolio.Portfolio memory p = portfolio.getPortfolioByUsername("alice");

        assertEq(p.ethAddress, alice);
        assertEq(p.ipfsDocumentHash, "QmHash");
        assertFalse(p.isPrivate);
        assertTrue(p.exists);
        assertEq(portfolio.totalPortfolios(), 1);
    }

    function testCreatePortfolioDuplicateUsernameReverts() public {
        vm.prank(alice);
        portfolio.createPortfolio("alice", "QmHash", false);

        vm.prank(bob);
        vm.expectRevert("Username taken");
        portfolio.createPortfolio("alice", "QmHash2", false);
    }

    function testCreatePortfolioSameAddressTwiceReverts() public {
        vm.prank(alice);
        portfolio.createPortfolio("alice", "QmHash", false);

        vm.prank(alice);
        vm.expectRevert("Address already has portfolio");
        portfolio.createPortfolio("alice2", "QmHash2", false);
    }

    // UPDATE PORTFOLIO
    function testUpdatePortfolioByOwner() public {
        vm.prank(alice);
        portfolio.createPortfolio("alice", "QmHash", false);

        vm.prank(alice);
        portfolio.updatePortfolioHash("alice", "QmNewHash");

        Web3Portfolio.Portfolio memory p = portfolio.getPortfolioByUsername("alice");

        assertEq(p.ipfsDocumentHash, "QmNewHash");
    }

    function testUpdatePortfolioByNonOwnerReverts() public {
        vm.prank(alice);
        portfolio.createPortfolio("alice", "QmHash", false);

        vm.prank(bob);
        vm.expectRevert("Not portfolio owner");
        portfolio.updatePortfolioHash("alice", "QmNewHash");
    }

    // VISIBILITY
    function testPrivatePortfolioAccessControl() public {
        vm.prank(alice);
        portfolio.createPortfolio("alice", "QmHash", true);

        vm.prank(bob);
        vm.expectRevert("Private portfolio");
        portfolio.getPortfolioByUsername("alice");

        vm.prank(alice);
        portfolio.getPortfolioByUsername("alice");
    }

    // DONATIONS
    function testDonateEther() public {
        vm.deal(alice, 1 ether);

        vm.prank(alice);
        portfolio.donate{value: 0.5 ether}();

        assertEq(portfolio.totalDonations(), 0.5 ether);
        assertEq(address(portfolio).balance, 0.5 ether);
    }

    function testWithdrawOnlyOwner() public {
        vm.deal(alice, 1 ether);

        vm.prank(alice);
        portfolio.donate{value: 1 ether}();

        vm.prank(bob);
        vm.expectRevert();
        portfolio.withdraw(0.5 ether);

        vm.prank(owner);
        portfolio.withdraw(0.5 ether);

        assertEq(address(portfolio).balance, 0.5 ether);
    }

    // PAUSE
    function testPauseStopsStateChanges() public {
        vm.prank(owner);
        portfolio.pause();

        vm.prank(alice);
        vm.expectRevert();
        portfolio.createPortfolio("alice", "QmHash", false);
    }

    // RECEIVE & FALLBACK
    function testReceiveEther() public {
        vm.deal(alice, 1 ether);

        vm.prank(alice);
        (bool ok,) = address(portfolio).call{value: 0.2 ether}("");

        assertTrue(ok);
        assertEq(portfolio.totalDonations(), 0.2 ether);
    }

    function testFallbackReverts() public {
        vm.prank(alice);
        vm.expectRevert("Invalid call");
        (bool success,) = address(portfolio).call(abi.encodeWithSignature("randomFunction()"));
        success;
    }

    // ============================================
    // META-TRANSACTION TESTS
    // ============================================

    /**
     * @dev Test meta-transaction create portfolio
     * Uses TrustedForwarder to execute gasless transaction
     */
    function testMetaTransactionCreatePortfolio() public {
        // Get alice's private key for signing
        uint256 alicePrivateKey = 0xA11CE;
        alice = vm.addr(alicePrivateKey);

        // Prepare request data
        bytes memory data = abi.encodeWithSignature("createPortfolio(string,string,bool)", "alice", "QmHash", false);

        // Get current nonce
        uint256 nonce = forwarder.nonces(alice);
        uint256 deadline = block.timestamp + 1 hours;

        // Sign the request
        bytes memory signature =
            _signRequest(alicePrivateKey, alice, address(portfolio), 0, 300000, nonce, deadline, data);

        // Build ForwardRequestData struct
        ERC2771Forwarder.ForwardRequestData memory request = ERC2771Forwarder.ForwardRequestData({
            from: alice,
            to: address(portfolio),
            value: 0,
            gas: 300000,
            // Casting to uint48 is safe because block.timestamp won't exceed uint48 max for ~8900 years
            // forge-lint: disable-next-line(unsafe-typecast)
            deadline: uint48(deadline),
            data: data,
            signature: signature
        });

        // Execute via forwarder (relayer calls this)
        address relayer = address(0x999);
        vm.prank(relayer);
        forwarder.execute(request);

        // Verify portfolio was created for alice (not relayer!)
        Web3Portfolio.Portfolio memory p = portfolio.getPortfolioByUsername("alice");
        assertEq(p.ethAddress, alice);
        assertEq(portfolio.totalPortfolios(), 1);
    }

    /**
     * @dev Helper function to sign requests using EIP-712
     * This simulates what user does off-chain with MetaMask
     */
    function _signRequest(
        uint256 privateKey,
        address from,
        address to,
        uint256 value,
        uint256 gas,
        uint256 nonce,
        uint256 deadline,
        bytes memory data
    ) internal view returns (bytes memory) {
        // Build EIP-712 struct hash
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint48 deadline,bytes data)"
                ),
                from,
                to,
                value,
                gas,
                nonce,
                deadline,
                keccak256(data)
            )
        );

        // Build domain separator
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Web3PortfolioForwarder")),
                keccak256(bytes("1")),
                block.chainid,
                address(forwarder)
            )
        );

        // Create final digest
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

        // Sign with private key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);

        return abi.encodePacked(r, s, v);
    }
}
