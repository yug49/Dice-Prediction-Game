// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

/**
 * @title ILiquidityPool
 * @author Yug Agarwal
 * @dev Interface for the LiquidityPool contract
 */
interface ILiquidityPool {
    // Events
    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event RewardsAdded(uint256 amount);
    event WinningAmountWithdrawn(uint256 amount);

    // Errors
    error LiquidityPool__ZeroValueNotAllowed();
    error LiquidityPool__NotOwner();
    error LiquidityPool__InvalidAddress();
    error LiquidityPool__TransferFailed();
    error LiquidityPool__InsufficientLiquidity();
    error LiquidityPool__Locked();

    // External functions
    function addLiquidity() external payable;
    function removeLiquidity(uint256 _amount) external;
    function addToRewards() external payable;
    function getWinningAmountDifference(uint256 _winningAmountDifference) external;

    // View functions
    function getTotalLiquidity() external view returns (uint256);
    function getLiquidityToken() external view returns (address);
    function getDiceGame() external view returns (address);
    function getLiquidityProviderBalance(address _provider) external view returns (uint256);
    function getLiquidityProviderShares(address _provider) external view returns (uint256);
}
