// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {LiquidityPool} from "../src/LiquidityPool.sol";
import {DiceToken} from "../src/DiceToken.sol";

/**
 * @title  LiquidityPoolTest
 * @author Yug Agarwal
 * @dev This contract is a test suite for the LiquidityPool contract.
 *
 *                          .            .                                   .#                        
 *                        +#####+---+###+#############+-                  -+###.                       
 *                        +###+++####+##-+++++##+++##++####+-.         -+###+++                        
 *                        +#########.-#+--+####++###- -########+---+++#####+++                         
 *                        +#######+#+++--+####+-..-+-.###+++########+-++###++.                         
 *                       +######.     +#-#####+-.-------+############+++####-                          
 *                      +####++...     ########-++-        +##########++++++.                          
 *                     -#######-+.    .########+++          -++######+++-                               
 *                     #++########--+-+####++++-- . ..    .-#++--+##+####.                              
 *                    -+++++++++#####---###---.----###+-+########..-+#++##-                            
 *                    ++###+++++#####-..---.. .+##++++#++#++-+--.   .-++++#                             
 *                   .###+.  .+#+-+###+ ..    +##+##+#++----...---.  .-+--+.                            
 *                   ###+---------+####+   -####+-.......    ...--++.  .---.                           
 *                  -#++++-----#######+-  .-+###+.... .....      .-+##-.  .                            
 *                  ##+++###++######++-.   .--+---++---........  ...---.  .                            
 *                 -####+-+#++###++-.        .--.--...-----.......--..... .                            
 *                 +######+++###+--..---.....  ...---------------.. .. .  .                            
 *                .-#########+#+++--++--------......----++--.--.  .--+---.                             
 *                 -+++########++--++++----------------------.--+++--+++--                             
 *            .######-.-++++###+----------------------..---++--++-+++---..                             
 *            -##########-------+-----------------------+-++-++----..----+----+#####++--..             
 *            -#############+..  ..--..----------.....-+++++++++++++++++##################+.           
 *            --+++++#########+-   . ....  ....... -+++++++++++++++++++############-.----+##-          
 *            -----....-+#######+-             .. -+++++++++++++++++++++##+######+.       +++.         
 *            --------.....---+#####+--......----.+++++++++++++++++++++##+-+++##+.        -++-         
 *            -------...   .--++++++---.....-----.+++++++++++++++++++++++. -+++##-        .---         
 *            #################+--.....-------.  .+++++++++++++++++++++-       -+-.       .---         
 *            +#########++++-.. .......-+--..--++-++++++++++++++++++++-         .-... ....----         
 *            -#####++---..   .--       -+++-.  ..+++++++++++++++++++--        .-+-......-+---         
 *            +####+---...    -+#-   .  --++++-. .+++++++++++++++++++---        --        -+--         
 *            ++++++++++--....-++.--++--.--+++++-.+++++++++++++++++++---. .......         ----         
 *           .--++#########++-.--.+++++--++++###+-++++++++++++++++++++----   .-++-        ----         
 *            .-+#############+-.++#+-+-++#######-++++++++++++++++++++----   -++++-      ..---         
 *           .---+############+.+###++--++#####++-+++++++++++++++++++++-------++++-........-+-         
 *            --+-+##########-+######+++++-++++++-++++++++++++++++++++++-----.----.......---+-         
 *           .--+---#######..+#######+++++++--+++-+++++++++++++++++++++++-----------------+++-         
 *           .++--..-+##-.-########+++++---++ .+-.+++++++++++++++++++++++++++++++++++---+++++-         
 *           -+++. ..-..-+#########++-++--..--....+++++++++++++++++++++++++++++++++++++++++++-         
 *           -++-......-+++############++++----- .+++++++++++++++++++++++++++++++++++++++++++-         
 *           +##-.....---+#######+####+####+--++-.+++++++++++++++++++++++++++++++++++++++++++-         
 *          .#+++-...-++######++-+-----..----++##-+++++++++++++++++++++++++++++++++++++++++++-         
 *          .+++--------+##----+------+-..----+++-+++++++++++++++++++++++++++++++++++++++++++-         
 *           ----.-----+++-+-...------++-----...--+++++++++++++++++++++++++++++++++++++++++++-         
 *          .-..-.--.----..--.... ....++--.  ....-+++++++++++++++++++++++++++++++++++++++++++-         
 *           -----------.---..--..   ..+.  . ... .+++++++++++++++++++++++++++++++++++++++++++-         
 *         .+#+#+---####+-.    .....--...   .    .+++++++++++++++++++++++++++++++++++++++++++-         
 *         -+++++#++++++++.    ..-...--.. ..     .+++++++++++++++++++++++++++++++++++++++++++-         
 *         ++++++-------++--   . ....--.. . . .. .+++++++++++++++++++++++++-+----------...             
 *         -++++--++++.------......-- ...  ..  . .---------------...                                   
 *         -++-+####+++---..-.........                                                                  
 *           .....
 */
contract LiquidityPoolTest is Test {
    LiquidityPool public liquidityPool;
    DiceToken public diceToken;

    address public diceGame = makeAddr("diceGame");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");

    uint256 public constant INITIAL_BALANCE = 100 ether;

    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event RewardsAdded(uint256 amount);

    function setUp() public {
        liquidityPool = new LiquidityPool(diceGame);

        diceToken = DiceToken(liquidityPool.getLiquidityToken());

        vm.deal(user1, INITIAL_BALANCE);
        vm.deal(user2, INITIAL_BALANCE);
        vm.deal(user3, INITIAL_BALANCE);
        vm.deal(diceGame, INITIAL_BALANCE);
    }

    function test_DeploymentState() public view {
        assertEq(liquidityPool.getDiceGame(), diceGame);
        assertEq(liquidityPool.getTotalLiquidity(), 0);
        assertEq(address(liquidityPool.getLiquidityToken()), address(diceToken));
    }

    function test_AddLiquidity() public {
        uint256 liquidityAmount = 10 ether;

        vm.expectEmit(true, false, false, true);
        emit LiquidityAdded(user1, liquidityAmount);

        vm.prank(user1);
        liquidityPool.addLiquidity{value: liquidityAmount}();

        assertEq(liquidityPool.getTotalLiquidity(), liquidityAmount);
        assertEq(diceToken.balanceOf(user1), liquidityAmount);
        assertEq(liquidityPool.getLiquidityProviderBalance(user1), liquidityAmount);
        assertEq(user1.balance, INITIAL_BALANCE - liquidityAmount);
    }

    function test_AddLiquidityMultipleUsers() public {
        uint256 amount1 = 10 ether;
        uint256 amount2 = 5 ether;

        vm.prank(user1);
        liquidityPool.addLiquidity{value: amount1}();

        vm.prank(user2);
        liquidityPool.addLiquidity{value: amount2}();

        assertEq(liquidityPool.getTotalLiquidity(), amount1 + amount2);
        assertEq(liquidityPool.getLiquidityProviderBalance(user1), amount1);
        assertEq(liquidityPool.getLiquidityProviderBalance(user2), amount2);
        assertEq(user1.balance, INITIAL_BALANCE - amount1);
        assertEq(user2.balance, INITIAL_BALANCE - amount2);
        assertEq(diceToken.balanceOf(user1), amount1);
        assertEq(diceToken.balanceOf(user2), amount2);
    }

    function test_RevertWhen_AddLiquidityWithZeroValue() public {
        vm.expectRevert(LiquidityPool.LiquidityPool__ZeroValueNotAllowed.selector);

        vm.prank(user1);
        liquidityPool.addLiquidity{value: 0}();
    }

    function test_RemoveLiquidity() public {
        uint256 liquidityAmount = 10 ether;
        uint256 withdrawAmount = 3 ether;

        vm.prank(user1);
        liquidityPool.addLiquidity{value: liquidityAmount}();

        uint256 initialBalance = user1.balance;

        vm.expectEmit(true, false, false, true);
        emit LiquidityRemoved(user1, withdrawAmount);

        vm.prank(user1);
        liquidityPool.removeLiquidity(withdrawAmount);

        assertEq(liquidityPool.getTotalLiquidity(), liquidityAmount - withdrawAmount);
        assertEq(diceToken.balanceOf(user1), liquidityAmount - withdrawAmount);
        assertEq(liquidityPool.getLiquidityProviderBalance(user1), liquidityAmount - withdrawAmount);
        assertEq(user1.balance, initialBalance + withdrawAmount);
    }

    function test_RemoveAllLiquidity() public {
        uint256 liquidityAmount = 10 ether;

        vm.prank(user1);
        liquidityPool.addLiquidity{value: liquidityAmount}();

        uint256 initialBalance = user1.balance;

        vm.prank(user1);
        liquidityPool.removeLiquidity(liquidityAmount);

        assertEq(liquidityPool.getTotalLiquidity(), 0);
        assertEq(diceToken.balanceOf(user1), 0);
        assertEq(user1.balance, initialBalance + liquidityAmount);
    }

    function test_RevertWhenRemoveLiquidityWithZeroAmount() public {
        vm.expectRevert(LiquidityPool.LiquidityPool__ZeroValueNotAllowed.selector);

        vm.prank(user1);
        liquidityPool.removeLiquidity(0);
    }

    function test_RevertWhenRemoveLiquidityInsufficientBalance() public {
        uint256 liquidityAmount = 10 ether;
        uint256 withdrawAmount = 15 ether;

        vm.prank(user1);
        liquidityPool.addLiquidity{value: liquidityAmount}();

        vm.expectRevert(LiquidityPool.LiquidityPool__InsufficientLiquidity.selector);

        vm.prank(user1);
        liquidityPool.removeLiquidity(withdrawAmount);
    }

    function test_RevertWhenUserTriesToWithdrawMoreThanHisDepositedLiquidity() public {
        uint256 liquidityAmount = 10 ether;
        uint256 withdrawAmount = 15 ether;

        vm.prank(user1);
        liquidityPool.addLiquidity{value: liquidityAmount}();
        vm.prank(user2);
        liquidityPool.addLiquidity{value: liquidityAmount}();

        vm.expectRevert(LiquidityPool.LiquidityPool__InsufficientLiquidity.selector);
        vm.prank(user1);
        liquidityPool.removeLiquidity(withdrawAmount);
    }

    function test_RevertWhenRemoveLiquidityWithoutAnyBalance() public {
        vm.expectRevert(LiquidityPool.LiquidityPool__InsufficientLiquidity.selector);

        vm.prank(user1);
        liquidityPool.removeLiquidity(1 ether);
    }

    function test_AddToRewards() public {
        uint256 initialLiquidity = 10 ether;
        uint256 rewardAmount = 2 ether;

        vm.prank(user1);
        liquidityPool.addLiquidity{value: initialLiquidity}();

        uint256 initialTokenBalance = diceToken.balanceOf(user1);

        vm.expectEmit(false, false, false, true);
        emit RewardsAdded(rewardAmount);

        vm.prank(diceGame);
        liquidityPool.addToRewards{value: rewardAmount}();

        assertEq(liquidityPool.getTotalLiquidity(), initialLiquidity + rewardAmount);
        assertGt(diceToken.balanceOf(user1), initialTokenBalance);
        assertEq(diceToken.balanceOf(user1), initialLiquidity + rewardAmount);
    }

    function test_AddToRewardsMultipleProviders() public {
        uint256 amount1 = 10 ether;
        uint256 amount2 = 5 ether;
        uint256 rewardAmount = 3 ether;

        vm.prank(user1);
        liquidityPool.addLiquidity{value: amount1}();

        vm.prank(user2);
        liquidityPool.addLiquidity{value: amount2}();

        uint256 totalLiquidity = amount1 + amount2;

        vm.prank(diceGame);
        liquidityPool.addToRewards{value: rewardAmount}();

        uint256 expectedUser1Balance = amount1 + (rewardAmount * amount1) / totalLiquidity;
        uint256 expectedUser2Balance = amount2 + (rewardAmount * amount2) / totalLiquidity;

        assertEq(diceToken.balanceOf(user1), expectedUser1Balance);
        assertEq(diceToken.balanceOf(user2), expectedUser2Balance);
    }

    function test_RevertWhenAddToRewardsNotOwner() public {
        vm.expectRevert(LiquidityPool.LiquidityPool__NotOwner.selector);

        vm.prank(user1);
        liquidityPool.addToRewards{value: 1 ether}();
    }

    function test_RevertWhenAddToRewardsZeroValue() public {
        vm.expectRevert(LiquidityPool.LiquidityPool__ZeroValueNotAllowed.selector);

        vm.prank(diceGame);
        liquidityPool.addToRewards{value: 0}();
    }

    function test_LiquidityTokenSharesTracking() public {
        uint256 amount1 = 10 ether;
        uint256 amount2 = 20 ether;

        vm.prank(user1);
        liquidityPool.addLiquidity{value: amount1}();

        assertEq(liquidityPool.getLiquidityProviderShares(user1), amount1);

        vm.prank(user2);
        liquidityPool.addLiquidity{value: amount2}();

        assertEq(liquidityPool.getLiquidityProviderShares(user2), amount2);
    }

    function test_ComplexScenario() public {
        vm.prank(user1);
        liquidityPool.addLiquidity{value: 10 ether}();

        vm.prank(user2);
        liquidityPool.addLiquidity{value: 5 ether}();

        // Add rewards
        vm.prank(diceGame);
        liquidityPool.addToRewards{value: 3 ether}();

        vm.prank(user3);
        liquidityPool.addLiquidity{value: 2 ether}();

        assertEq(liquidityPool.getTotalLiquidity(), 20 ether);

        vm.prank(user1);
        liquidityPool.removeLiquidity(5 ether);

        assertEq(liquidityPool.getTotalLiquidity(), 15 ether);

        assertApproxEqAbs(diceToken.balanceOf(user1), 7 ether, 1);
        assertApproxEqAbs(diceToken.balanceOf(user2), 6 ether, 1);
        assertApproxEqAbs(diceToken.balanceOf(user3), 2 ether, 1);
    }

    function test_RevertWhenInvalidConstructorAddress() public {
        vm.expectRevert(LiquidityPool.LiquidityPool__InvalidAddress.selector);
        new LiquidityPool(address(0));
    }

    function test_Fuzz_AddAndRemoveLiquidity(uint128 amount) public {
        vm.assume(amount > 0 && amount <= INITIAL_BALANCE);

        vm.prank(user1);
        liquidityPool.addLiquidity{value: amount}();

        assertEq(diceToken.balanceOf(user1), amount);

        vm.prank(user1);
        liquidityPool.removeLiquidity(amount);

        assertEq(diceToken.balanceOf(user1), 0);
        assertEq(liquidityPool.getTotalLiquidity(), 0);
    }
}
