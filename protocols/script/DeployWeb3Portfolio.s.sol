// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {Web3Portfolio} from "../src/Web3Portfolio.sol";
import {TrustedForwarder} from "../src/TrustedForwarder.sol";
import {console} from "forge-std/console.sol";

contract DeployWeb3Portfolio is Script {
    TrustedForwarder public forwarder;
    Web3Portfolio public portfolio;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy TrustedForwarder
        forwarder = new TrustedForwarder("Web3PortfolioForwarder");
        console.log("TrustedForwarder:", address(forwarder));
        
        // Deploy Web3Portfolio
        portfolio = new Web3Portfolio(address(forwarder));
        console.log("Web3Portfolio:", address(portfolio));
        
        vm.stopBroadcast();
    }
}
