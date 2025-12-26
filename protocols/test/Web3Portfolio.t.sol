// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {Web3Portfolio} from "../src/Web3Portfolio.sol";

contract Web3PortfolioTest is Test {
    Web3Portfolio portfolio;

    address owner = address(0x1);
    address alice = address(0x2);
    address bob = address(0x3);

    function setUp() public {
        vm.prank(owner);
        portfolio = new Web3Portfolio();
    }

    // DEPLOYMENT
    function testOwnerIsSetCorrectly() public view {
        assertEq(portfolio.owner(), owner);
    }

    function testInitialCountersAreZero() public view {
        assertEq(portfolio.totalPortfolios(), 0);
        assertEq(portfolio.totalDonations(), 0);
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
        vm.expectRevert("Address already registered");
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

    // DELETE PORTFOLIO
    function testDeleteMyPortfolio() public {
        vm.prank(alice);
        portfolio.createPortfolio("alice", "QmHash", false);

        assertEq(portfolio.totalPortfolios(), 1);

        vm.prank(alice);
        portfolio.deleteMyPortfolio();

        assertEq(portfolio.totalPortfolios(), 0);

        vm.prank(alice);
        vm.expectRevert("Portfolio not found");
        portfolio.getMyPortfolio();
    }

    function testDeletePortfolioNotFound() public {
        vm.prank(alice);
        vm.expectRevert("Portfolio not found");
        portfolio.deleteMyPortfolio();
    }

    // GET MY PORTFOLIO
    function testGetMyPortfolio() public {
        vm.prank(alice);
        portfolio.createPortfolio("alice", "QmHash", false);

        vm.prank(alice);
        Web3Portfolio.Portfolio memory p = portfolio.getMyPortfolio();

        assertEq(p.ethAddress, alice);
        assertEq(p.ipfsDocumentHash, "QmHash");
    }

    function testGetMyPortfolioNotFound() public {
        vm.prank(alice);
        vm.expectRevert("Portfolio not found");
        portfolio.getMyPortfolio();
    }
}
