// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {Web3Portfolio} from "../src/Web3Portfolio.sol";
import {console} from "forge-std/console.sol";

contract DeployWeb3Portfolio is Script {
    Web3Portfolio public portfolio;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Web3Portfolio
        portfolio = new Web3Portfolio();
        console.log("Web3Portfolio:", address(portfolio));
        
        vm.stopBroadcast();
    }
}
