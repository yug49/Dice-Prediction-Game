// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import {Script, console} from "../lib/forge-std/src/Script.sol";
import {VRFCoordinatorV2PlusMock} from "../src/mocks/VRFCoordinatorV2PlusMock.sol";
import {LinkToken} from "../src/mocks/LinkToken.sol";

abstract contract CodeConstants {
    /* VRF Mock Values */
    uint96 public MOCK_BASE_FEES = 0.25 ether;
    uint96 public MOCK_GAS_PRICE = 1e9;

    /* Chain IDs */
    uint256 public constant ETH_SEPOLIA_CHAIN_ID = 11155111;
    uint256 public constant ANVIL_CHAIN_ID = 31337;

    /* Default Anvil Key */
    uint256 public constant DEFAULT_ANVIL_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
}

contract HelperConfig is Script, CodeConstants {
    error HelperConfig__InvalidChainId();

    struct NetworkConfig {
        uint256 minBet;
        address vrfCoordinator;
        bytes32 gasLane;
        uint256 subscriptionId;
        uint32 callBackGasLimit;
        uint256 deployerKey;
        address link;
    }

    NetworkConfig public localNetworkConfig;
    mapping(uint256 chainId => NetworkConfig) public networkConfigs;

    constructor() {
        networkConfigs[ETH_SEPOLIA_CHAIN_ID] = getSepoliaEthConfig();
    }

    function getConfigByChainId(uint256 chainId) public returns (NetworkConfig memory) {
        if (networkConfigs[chainId].vrfCoordinator != address(0)) {
            return networkConfigs[chainId];
        } else if (chainId == ANVIL_CHAIN_ID) {
            return getAnvilEthConfig();
        } else {
            revert HelperConfig__InvalidChainId();
        }
    }

    function getConfig() public returns (NetworkConfig memory) {
        return getConfigByChainId(block.chainid);
    }

    function setConfig(uint256 chainId, NetworkConfig memory networkConfig) public {
        networkConfigs[chainId] = networkConfig;
    }

    function getSepoliaEthConfig() public view returns (NetworkConfig memory) {
        console.log("getting sepolia config");
        return NetworkConfig({
            minBet: 0.000005 ether, // 5e12
            vrfCoordinator: 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B,
            gasLane: 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae,
            subscriptionId: 39479495189486144213615272566875887764374593789286701718854749990062729762837,
            callBackGasLimit: 500000, //5e5
            deployerKey: vm.envUint("PRIVATE_KEY"),
            link: 0x779877A7B0D9E8603169DdbD7836e478b4624789
        });
    }

    function getAnvilEthConfig() public returns (NetworkConfig memory) {
        // check to see if we set an active network config
        if (localNetworkConfig.vrfCoordinator != address(0)) {
            return localNetworkConfig;
        }

        //Deploy mocks and such
        vm.startBroadcast();
        VRFCoordinatorV2PlusMock vrfCoordinatorMock = new VRFCoordinatorV2PlusMock(MOCK_BASE_FEES, MOCK_GAS_PRICE);
        LinkToken mockLinkToken = new LinkToken();
        vm.stopBroadcast();

        console.log("getting anvil config");
        localNetworkConfig = NetworkConfig({
            minBet: 0.000005 ether, // 5e12
            vrfCoordinator: address(vrfCoordinatorMock),
            gasLane: 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae,
            subscriptionId: 0,
            callBackGasLimit: 500000, //5e5
            deployerKey: DEFAULT_ANVIL_KEY,
            link: address(mockLinkToken)
        });

        return localNetworkConfig;
    }
}
