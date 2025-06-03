// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {DiceToken} from "./DiceToken.sol";

/**
 * @title LiquidityPool
 * @author Yug Agarwal
 * @dev A liquidity pool contract where liquidity providers can deposit and withdraw liquidity in native tokens.
 * @dev also this serves as a base contract for the DiceGame contract.
 * @dev This contract is owned by DiceGame contract.
 * @notice The liquidity providers can gain rewards based on the performances of players in the DiceGame contract.
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
contract LiquidityPool {
    error LiquidityPool__ZeroValueNotAllowed();
    error LiquidityPool__NotOwner();
    error LiquidityPool__InvalidAddress();
    error LiquidityPool__TransferFailed();
    error LiquidityPool__InsufficientLiquidity();
    error LiquidityPool__Locked();

    enum Lock {
        LOCKED,
        UNLOCKED
    }

    address private immutable i_diceGame;
    DiceToken private immutable i_liquidityToken;
    Lock private s_lock;

    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event RewardsAdded(uint256 amount);
    event WinningAmountWithdrawn(uint256 amount);

    modifier onlyDiceGame() {
        if (msg.sender != i_diceGame) {
            revert LiquidityPool__NotOwner();
        }
        _;
    }

    modifier lock() {
        if (s_lock == Lock.LOCKED) {
            revert LiquidityPool__Locked();
        }
        s_lock = Lock.LOCKED;
        _;
        s_lock = Lock.UNLOCKED;
    }

    constructor(address _diceGameAddress) {
        if (_diceGameAddress == address(0)) {
            revert LiquidityPool__InvalidAddress();
        }
        i_diceGame = _diceGameAddress;
        i_liquidityToken = new DiceToken();
        s_lock = Lock.UNLOCKED;
    }

    function addLiquidity() external payable lock {
        if (msg.value == 0) {
            revert LiquidityPool__ZeroValueNotAllowed();
        }

        i_liquidityToken.mint(msg.sender, msg.value);

        emit LiquidityAdded(msg.sender, msg.value);
    }

    function removeLiquidity(uint256 _amount) external lock {
        if (_amount == 0) {
            revert LiquidityPool__ZeroValueNotAllowed();
        }
        if (i_liquidityToken.balanceOf(msg.sender) < _amount) {
            revert LiquidityPool__InsufficientLiquidity();
        }
        if (address(this).balance < _amount) {
            revert LiquidityPool__InsufficientLiquidity();
        }

        i_liquidityToken.burnFrom(msg.sender, _amount);

        (bool success,) = payable(msg.sender).call{value: _amount}("");

        if (!success) {
            revert LiquidityPool__TransferFailed();
        }

        emit LiquidityRemoved(msg.sender, _amount);
    }

    function addToRewards() external payable lock onlyDiceGame {
        if (msg.value == 0) {
            revert LiquidityPool__ZeroValueNotAllowed();
        }

        i_liquidityToken.rebase();

        emit RewardsAdded(msg.value);
    }

    function getWinningAmountDifference(uint256 _winningAmountDifference) external lock onlyDiceGame{
        if (_winningAmountDifference == 0) {
            revert LiquidityPool__ZeroValueNotAllowed();
        }
        if (address(this).balance < _winningAmountDifference) {
            revert LiquidityPool__InsufficientLiquidity();
        }

        (bool success,) = payable(i_diceGame).call{value: _winningAmountDifference}("");

        if (!success) {
            revert LiquidityPool__TransferFailed();
        }
        
        i_liquidityToken.rebase();

        emit WinningAmountWithdrawn(_winningAmountDifference);
    }

    function getTotalLiquidity() external view returns (uint256) {
        return address(this).balance;
    }

    function getLiquidityToken() external view returns (address) {
        return address(i_liquidityToken);
    }

    function getDiceGame() external view returns (address) {
        return i_diceGame;
    }

    function getLiquidityProviderBalance(address _provider) external view returns (uint256) {
        return i_liquidityToken.balanceOf(_provider);
    }

    function getLiquidityProviderShares(address _provider) external view returns (uint256) {
        return i_liquidityToken.sharesOf(_provider);
    }
}
