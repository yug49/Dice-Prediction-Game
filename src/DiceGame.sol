// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {VRFConsumerBaseV2Plus} from
    "../lib/chainlink-brownie-contracts/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from
    "../lib/chainlink-brownie-contracts/contracts/src/v0.8//vrf/dev/libraries/VRFV2PlusClient.sol";
import {IVRFCoordinatorV2Plus} from
    "../lib/chainlink-brownie-contracts/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import {ILiquidityPool} from "./interfaces/ILiquidityPool.sol";

/**
 * @title DiceGame
 * @author Yug Agarwal
 * @dev A simple dice game contract where players can bet on the outcome and win rewards based on the roll of a dice.
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
contract DiceGame is VRFConsumerBaseV2Plus {
    error DiceGame__ZeroValueNotAllowed();
    error DiceGame__BetTooLow();
    error DiceGame__GameClosed();
    error DiceGame__TokenNotAllowed();
    error DiceGame__TransferFailed();
    error DiceGame__InvalidPrediction();
    error DiceGame__GameFailed();
    error DiceGame__LiquidityPoolAlreadySetCannotBeChanged();
    error DiceGame__InvalidAddress();

    enum GameState {
        OPEN,
        LOCKED
    }

    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint16 private constant MULTIPLIER = 2; // 2x multiplier

    uint256 private immutable i_minBet;
    bytes32 private immutable i_gasLane;
    uint256 private immutable i_subscriptionId;
    uint32 private immutable i_callBackGasLimit;

    address private s_liquidityPool; // Address of the liquidity pool contract
    IVRFCoordinatorV2Plus private immutable i_vrfCoordinator;
    GameState private s_gameState;
    mapping(address => uint256) private s_playersScores;
    address[] private s_players;
    uint8 private s_mostRecentRoll;

    uint8 private s_predictedNumber;
    address payable private s_currentPlayer;
    uint256 private s_bet;

    modifier onlyLiquidityPool() {
        if (msg.sender != s_liquidityPool) revert DiceGame__InvalidAddress();
        _;
    }

    modifier Lock() {
        if (s_gameState == GameState.LOCKED) revert DiceGame__GameClosed();
        s_gameState = GameState.LOCKED;
        _;
        s_gameState = GameState.OPEN;
    }

    event PlayerWon(
        address indexed player, uint256 indexed betAmount, uint256 winningAmount, uint256 indexed rolledNumber
    );

    event PlayerLost(address indexed player, uint256 indexed betAmount, uint256 indexed rolledNumber);

    /**
     * @param _minBet Minimum bet amount
     * @param _vrfCoordinator VRF Coordinator address
     * @param _gasLane Gas lane key hash
     * @param _subscriptionId Subscription ID for VRF
     * @param _callBackGasLimit Callback gas limit for VRF
     */
    constructor(
        uint256 _minBet,
        address _vrfCoordinator,
        bytes32 _gasLane,
        uint256 _subscriptionId,
        uint32 _callBackGasLimit
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        if (_minBet == 0) revert DiceGame__ZeroValueNotAllowed();
        i_minBet = _minBet;
        s_gameState = GameState.OPEN;
        i_vrfCoordinator = IVRFCoordinatorV2Plus(_vrfCoordinator);
        i_gasLane = _gasLane;
        i_subscriptionId = _subscriptionId;
        i_callBackGasLimit = _callBackGasLimit;
    }

    function setLiquidityPool(address _liquidityPool) external {
        if (_liquidityPool == address(0)) revert DiceGame__InvalidAddress();

        if (s_liquidityPool == address(0)) {
            s_liquidityPool = _liquidityPool;
        } else {
            revert DiceGame__LiquidityPoolAlreadySetCannotBeChanged();
        }
    }

    /**
     * @param _prediction The number the player predicted the dice will roll (1-6)
     * @dev Players can call this function to roll the dice and bet on the outcome.
     */
    function rollDice(uint8 _prediction) external payable Lock {
        if (msg.value < i_minBet) revert DiceGame__BetTooLow();
        if (_prediction < 1 || _prediction > 6) revert DiceGame__InvalidPrediction();

        s_predictedNumber = _prediction;
        s_currentPlayer = payable(msg.sender);
        s_bet = msg.value;

        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: i_gasLane,
                subId: i_subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: i_callBackGasLimit,
                numWords: NUM_WORDS,
                // set nativePayment to true to pay the VRF requests with Sepolia ETH instead of LINK
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
            })
        );

        if (requestId == 0) {
            revert DiceGame__GameFailed();
        }
    }

    /**
     * @param randomWords The array of random words returned by the VRF
     */
    function fulfillRandomWords(uint256, /*requestId*/ uint256[] calldata randomWords) internal override {
        uint256 rolledNumber;
        randomWords[0] < 6 ? rolledNumber = randomWords[0] + 1 : rolledNumber = (randomWords[0] % 6) + 1;
        s_mostRecentRoll = uint8(rolledNumber);
        if (uint8(rolledNumber) == s_predictedNumber) {
            uint256 winningAmount = s_bet * MULTIPLIER;
            uint256 amountToGetFromPool = winningAmount - s_bet;
            ILiquidityPool(s_liquidityPool).getWinningAmountDifference(amountToGetFromPool);

            (bool success,) = s_currentPlayer.call{value: winningAmount}("");
            if (!success) {
                revert DiceGame__TransferFailed();
            }
            if (s_playersScores[s_currentPlayer] == 0) s_players.push(s_currentPlayer);

            unchecked {
                s_playersScores[s_currentPlayer]++;
            }

            emit PlayerWon(s_currentPlayer, s_bet, winningAmount, rolledNumber);
        } else {
            (bool success,) = payable(s_liquidityPool).call{value: s_bet}(abi.encodeWithSignature("addToRewards()"));

            if (!success) {
                revert DiceGame__TransferFailed();
            }

            emit PlayerLost(s_currentPlayer, s_bet, rolledNumber);
        }

        s_predictedNumber = 0;
        s_currentPlayer = payable(address(0));
        s_bet = 0;
    }

    receive() external payable onlyLiquidityPool {}

    /* External View Getter Functions */

    function getPlayers() external view returns (address[] memory) {
        return s_players;
    }

    function getPlayerScore(address _player) external view returns (uint256) {
        return s_playersScores[_player];
    }

    function getLiquidityPool() external view returns (address) {
        return s_liquidityPool;
    }

    function getMinBet() external view returns (uint256) {
        return i_minBet;
    }

    function getSubscriptionId() external view returns (uint256) {
        return i_subscriptionId;
    }

    function getMostRecentRoll() external view returns (uint8) {
        return s_mostRecentRoll;
    }
}
