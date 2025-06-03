// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

/**
 * @title DiceToken
 * @author Yug Agarwal
 * @dev A Rebase token contract that acts as the amount of liquidity by liquidity providers and helps in distribution of rewards.
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
contract DiceToken is ERC20 {
    error DiceToken__InvalidAddress();
    error DiceToken__InvalidAmount();
    error DiceToken__InsufficientBalance();

    address private immutable i_liquidityPool;

    // Rebase mechanism variables
    uint256 private s_totalShares;
    mapping(address => uint256) private s_shares;

    // Events
    event Rebase(uint256 totalSupplyBefore, uint256 totalSupplyAfter);
    event SharesTransfer(address indexed from, address indexed to, uint256 shares);

    modifier onlyLiquidityPool() {
        if (msg.sender != i_liquidityPool) {
            revert DiceToken__InvalidAddress();
        }
        _;
    }

    constructor() ERC20("DiceToken", "DICE") {
        i_liquidityPool = msg.sender;
    }

    /**
     * @dev Override balanceOf to return the proportional balance based on shares
     * @param account the address of the account to check the balance of
     */
    function balanceOf(address account) public view override returns (uint256) {
        if (s_totalShares == 0) return 0;
        return (s_shares[account] * getTotalPoolValue()) / s_totalShares;
    }

    /**
     * @dev Override totalSupply to return the total pool value
     */
    function totalSupply() public view override returns (uint256) {
        return getTotalPoolValue();
    }

    /**
     * @dev Get the total ETH value in the liquidity pool
     */
    function getTotalPoolValue() public view returns (uint256) {
        return i_liquidityPool.balance;
    }

    /**
     * @dev Mint shares when liquidity is added
     * @param to The address to mint tokens to
     * @param ethAmount The amount of ETH to mint tokens for
     */
    function mint(address to, uint256 ethAmount) external onlyLiquidityPool {
        if (to == address(0)) {
            revert DiceToken__InvalidAddress();
        }
        if (ethAmount == 0) {
            revert DiceToken__InvalidAmount();
        }

        uint256 shares;
        if (s_totalShares == 0) {
            // First deposit: shares = ETH amount
            shares = ethAmount;
        } else {
            // Calculate shares based on current ratio
            shares = (ethAmount * s_totalShares) / (getTotalPoolValue() - ethAmount);
        }

        s_shares[to] += shares;
        s_totalShares += shares;

        emit Transfer(address(0), to, ethAmount);
        emit SharesTransfer(address(0), to, shares);
    }

    /**
     * @dev Burn shares when liquidity is removed
     * @param from The address to burn tokens from
     * @param ethAmount The amount of ETH to burn tokens for
     */
    function burnFrom(address from, uint256 ethAmount) external onlyLiquidityPool {
        if (from == address(0)) {
            revert DiceToken__InvalidAddress();
        }
        if (ethAmount == 0) {
            revert DiceToken__InvalidAmount();
        }

        uint256 sharesToBurn = (ethAmount * s_totalShares) / getTotalPoolValue();

        if (s_shares[from] < sharesToBurn) {
            revert DiceToken__InsufficientBalance();
        }

        s_shares[from] -= sharesToBurn;
        s_totalShares -= sharesToBurn;

        emit Transfer(from, address(0), ethAmount);
        emit SharesTransfer(from, address(0), sharesToBurn);
    }

    /**
     * @dev Trigger rebase event when rewards are added
     */
    function rebase() external onlyLiquidityPool {
        uint256 newTotalSupply = getTotalPoolValue();
        emit Rebase(newTotalSupply, newTotalSupply);
    }

    /**
     * @dev Transfer tokens to a specified address
     * @param to The address to transfer tokens to
     * @param amount The amount of tokens to transfer
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        if (amount == 0) return true;

        uint256 sharesToTransfer = (amount * s_totalShares) / getTotalPoolValue();
        address owner = _msgSender();

        if (s_shares[owner] < sharesToTransfer) {
            revert DiceToken__InsufficientBalance();
        }

        s_shares[owner] -= sharesToTransfer;
        s_shares[to] += sharesToTransfer;

        emit Transfer(owner, to, amount);
        emit SharesTransfer(owner, to, sharesToTransfer);
        return true;
    }

    /**
     * @dev Transfer tokens from one address to another
     * @param from The address to transfer tokens from
     * @param to The address to transfer tokens to
     * @param amount The amount of tokens to transfer
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        if (amount == 0) return true;

        uint256 sharesToTransfer = (amount * s_totalShares) / getTotalPoolValue();

        if (s_shares[from] < sharesToTransfer) {
            revert DiceToken__InsufficientBalance();
        }

        address spender = _msgSender();
        _spendAllowance(from, spender, amount);

        s_shares[from] -= sharesToTransfer;
        s_shares[to] += sharesToTransfer;

        emit Transfer(from, to, amount);
        emit SharesTransfer(from, to, sharesToTransfer);
        return true;
    }

    /* External getter functions */
    function sharesOf(address account) external view returns (uint256) {
        return s_shares[account];
    }

    function getTotalShares() external view returns (uint256) {
        return s_totalShares;
    }

    function getSharesByTokens(uint256 tokenAmount) external view returns (uint256) {
        if (getTotalPoolValue() == 0) return tokenAmount;
        return (tokenAmount * s_totalShares) / getTotalPoolValue();
    }

    function getTokensByShares(uint256 shares) external view returns (uint256) {
        if (s_totalShares == 0) return 0;
        return (shares * getTotalPoolValue()) / s_totalShares;
    }
}
