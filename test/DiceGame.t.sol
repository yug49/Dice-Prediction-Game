// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Test, console} from "../lib/forge-std/src/Test.sol";
import {DiceGame} from "../src/DiceGame.sol";
import {LiquidityPool} from "../src/LiquidityPool.sol";
import {DiceToken} from "../src/DiceToken.sol";
import {VRFCoordinatorV2PlusMock} from "../src/mocks/VRFCoordinatorV2PlusMock.sol";
import {DeployGame} from "../script/DeployGame.s.sol";
import {HelperConfig} from "../script/HelperConfig.s.sol";

contract DiceGameTest is Test {
    DiceGame public diceGame;
    LiquidityPool public liquidityPool;
    DiceToken public diceToken;
    VRFCoordinatorV2PlusMock public vrfCoordinator;
    DeployGame public deployer;
    HelperConfig public helperConfig;

    address public player1 = makeAddr("player1");
    address public player2 = makeAddr("player2");
    address public liquidityProvider = makeAddr("liquidityProvider");
    address public owner;
    uint256 public minBet;
    bytes32 public gasLane;
    uint256 public subId;
    uint32 public callBackGasLimit;

    uint256 public constant INITIAL_BALANCE = 100_000 ether;
    uint256 public constant MIN_BET = 5e12;
    uint256 public constant INITIAL_LIQUIDITY = 50 ether;

    // VRF Configuration
    uint96 public constant MOCK_BASE_FEE = 0.25 ether;
    uint96 public constant MOCK_GAS_PRICE_LINK = 1e9;
    bytes32 public constant MOCK_KEY_HASH = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c;
    uint256 public constant MOCK_SUBSCRIPTION_ID = 1;
    uint256 public constant SEPOLIA_SUBSCRIPTION_ID =
        37749700595957342042634028598145482046731427631570758426533291758021715136613;
    uint32 public constant MOCK_CALLBACK_GAS_LIMIT = 2500000;

    event PlayerWon(
        address indexed player, uint256 indexed betAmount, uint256 winningAmount, uint8 indexed rolledNumber
    );
    event PlayerLost(address indexed player, uint256 indexed betAmount, uint8 indexed rolledNumber);

    modifier funded() {
        vm.deal(owner, INITIAL_BALANCE);
        vm.deal(player1, INITIAL_BALANCE);
        vm.deal(player2, INITIAL_BALANCE);
        vm.deal(liquidityProvider, INITIAL_BALANCE);
        _;
    }

    modifier withLiquidity() {
        vm.prank(liquidityProvider);
        liquidityPool.addLiquidity{value: INITIAL_LIQUIDITY}();
        _;
    }

    function setUp() public funded {
        deployer = new DeployGame();
        (diceGame, liquidityPool, diceToken, helperConfig) = deployer.deployContracts();

        HelperConfig.NetworkConfig memory config = helperConfig.getConfig();

        minBet = config.minBet;
        owner = vm.addr(config.deployerKey);
        vrfCoordinator = VRFCoordinatorV2PlusMock(config.vrfCoordinator);
        gasLane = config.gasLane;
        subId = config.subscriptionId;
        callBackGasLimit = config.callBackGasLimit;
    }

    function test_DeploymentState() public view {
        assertEq(diceGame.getMinBet(), MIN_BET);
        assertEq(diceGame.getLiquidityPool(), address(liquidityPool));
        if (block.chainid == 31337) assertEq(diceGame.getSubscriptionId(), MOCK_SUBSCRIPTION_ID);
        else if (block.chainid == 11155111) assertEq(diceGame.getSubscriptionId(), SEPOLIA_SUBSCRIPTION_ID);
    }

    function test_SetLiquidityPool() public view {
        assertEq(diceGame.getLiquidityPool(), address(liquidityPool));
    }

    function test_RevertWhenSetLiquidityPoolTwice() public {
        LiquidityPool newLiquidityPool = new LiquidityPool(address(diceGame));

        vm.expectRevert(DiceGame.DiceGame__LiquidityPoolAlreadySetCannotBeChanged.selector);
        diceGame.setLiquidityPool(address(newLiquidityPool));
    }

    function test_RevertWhenSetLiquidityPoolZeroAddress() public {
        DiceGame newDiceGame =
            new DiceGame(MIN_BET, address(vrfCoordinator), MOCK_KEY_HASH, MOCK_SUBSCRIPTION_ID, MOCK_CALLBACK_GAS_LIMIT);

        vm.expectRevert(DiceGame.DiceGame__InvalidAddress.selector);
        newDiceGame.setLiquidityPool(address(0));
    }

    function test_RollDice() public withLiquidity {
        uint256 betAmount = 1 ether;
        uint8 prediction = 3;

        vm.prank(player1);
        diceGame.rollDice{value: betAmount}(prediction);
    }

    function test_RevertWhenBetTooLow() public {
        uint256 lowBet = MIN_BET - 1;
        uint8 prediction = 4;

        vm.expectRevert(DiceGame.DiceGame__BetTooLow.selector);
        vm.prank(player1);
        diceGame.rollDice{value: lowBet}(prediction);
    }

    function test_RevertWhenInvalidPrediction() public {
        uint256 betAmount = 1 ether;

        vm.expectRevert(DiceGame.DiceGame__InvalidPrediction.selector);
        vm.prank(player1);
        diceGame.rollDice{value: betAmount}(0);

        vm.expectRevert(DiceGame.DiceGame__InvalidPrediction.selector);
        vm.prank(player1);
        diceGame.rollDice{value: betAmount}(7);
    }

    /// @note To run the following test, you need to make the fulfillRandomWords function in the DiceGame from `fulfillRandomWords(...) internal override` to `_fulfillRandomWords(...) public`, also make the `fullfillRandomWords` function in the VRFConsumerBaseV2Plus contract from virtual to a normal empty function, otherwise the test will not be able to mock the VRF response correctly.
    /// @dev Since the random number generation in not in our hands, this is a workaround for testing purposes, in production you should not change the visibility of the fulfillRandomWords function.
    // function test_PlayerWins() public withLiquidity {
    //     console.log(
    //         "Make sure to change the visibility of the fulfillRandomWords function in the DiceGame contract to public to pass this test_PlayerWins test"
    //     );
    //     console.log(
    //         "Also change the fulfillRandomWords function in the VRFConsumerBaseV2Plus contract from virtual to a normal empty function."
    //     );

    //     uint256 betAmount = 1 ether;
    //     uint8 prediction = 3;
    //     uint256 expectedWinning = 2 ether; // 2x multiplier

    //     uint256 playerBalanceBefore = player1.balance;
    //     uint256 liquidityBefore = liquidityPool.getTotalLiquidity();

    //     vm.prank(player1);
    //     diceGame.rollDice{value: betAmount}(prediction);

    //     uint256[] memory mockRandomWords = new uint256[](1);
    //     mockRandomWords[0] = (uint8(prediction) - 1);
    //     diceGame._fulfillRandomWords(1, mockRandomWords);

    //     assertEq(player1.balance, playerBalanceBefore - betAmount + expectedWinning);
    //     assertEq(liquidityPool.getTotalLiquidity(), liquidityBefore + betAmount - expectedWinning);
    //     assertEq(diceGame.getPlayerScore(player1), 1);

    //     address[] memory players = new address[](1);
    //     players[0] = player1;
    //     assertEq(diceGame.getPlayers(), players);
    // }

    /// @notice To run the following test, you need to make the fulfillRandomWords function in the DiceGame from `fulfillRandomWords(...) internal override` to `_fulfillRandomWords(...) public`, also make the `fullfillRandomWords` function in the VRFConsumerBaseV2Plus contract from virtual to a normal empty function, otherwise the test will not be able to mock the VRF response correctly.
    /// @dev Since the random number generation in not in our hands, this is a workaround for testing purposes, in production you should not change the visibility of the fulfillRandomWords function.
    // function test_PlayerLoses() public withLiquidity {
    //     console.log(
    //         "Make sure to change the visibility of the fulfillRandomWords function in the DiceGame contract to public to pass this test_PlayerLoses test"
    //     );
    //     console.log(
    //         "Also change the fulfillRandomWords function in the VRFConsumerBaseV2Plus contract from virtual to a normal empty function."
    //     );

    //     uint256 betAmount = 1 ether;
    //     uint8 prediction = 3;

    //     uint256 playerBalanceBefore = player1.balance;
    //     uint256 liquidityBefore = liquidityPool.getTotalLiquidity();

    //     vm.prank(player1);
    //     diceGame.rollDice{value: betAmount}(prediction);

    //     uint256[] memory mockRandomWords = new uint256[](1);
    //     mockRandomWords[0] = (uint8(prediction - 1) - 1);
    //     diceGame._fulfillRandomWords(1, mockRandomWords);

    //     assertEq(player1.balance, playerBalanceBefore - betAmount);
    //     assertEq(liquidityPool.getTotalLiquidity(), liquidityBefore + betAmount);
    //     assertEq(diceGame.getPlayerScore(player1), 0);

    //     address[] memory players = new address[](0);
    //     assertEq(diceGame.getPlayers(), players);
    // }

    function test_ReceiveFunction() public {
        vm.deal(address(liquidityPool), 1 ether);
        vm.prank(address(liquidityPool));
        (bool success,) = address(diceGame).call{value: 1 ether}("");
        assertTrue(success);

        vm.expectRevert(DiceGame.DiceGame__InvalidAddress.selector);
        vm.prank(player1);
        (bool failed,) = address(diceGame).call{value: 1 ether}("");

        assertTrue(failed);
        assertEq(player1.balance, INITIAL_BALANCE);
    }

    function test_GetterFunctions() public view {
        assertEq(diceGame.getMinBet(), MIN_BET);
        assertEq(diceGame.getLiquidityPool(), address(liquidityPool));
        assertTrue(diceGame.getSubscriptionId() > 0);

        // Initially no players
        address[] memory players = diceGame.getPlayers();
        assertEq(players.length, 0);

        // Initially no scores
        assertEq(diceGame.getPlayerScore(player1), 0);
    }
}
