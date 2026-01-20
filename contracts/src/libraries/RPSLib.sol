// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IBaseRPS.sol";

/**
 * @title RPSLib
 * @notice Library for Rock Paper Scissors game logic
 */
library RPSLib {
    /**
     * @notice Compare two choices and determine the winner
     * @param choice1 Player 1's choice
     * @param choice2 Player 2's choice
     * @return result 0 = tie, 1 = player 1 wins, 2 = player 2 wins
     */
    function compare(
        IBaseRPS.Choice choice1,
        IBaseRPS.Choice choice2
    ) internal pure returns (uint8 result) {
        // Invalid choices should be caught before this
        require(
            choice1 != IBaseRPS.Choice.None && choice2 != IBaseRPS.Choice.None,
            "RPSLib: Invalid choice"
        );

        // Same choice = tie
        if (choice1 == choice2) {
            return 0;
        }

        // Rock beats Scissors
        // Paper beats Rock
        // Scissors beats Paper
        if (
            (choice1 == IBaseRPS.Choice.Rock && choice2 == IBaseRPS.Choice.Scissors) ||
            (choice1 == IBaseRPS.Choice.Paper && choice2 == IBaseRPS.Choice.Rock) ||
            (choice1 == IBaseRPS.Choice.Scissors && choice2 == IBaseRPS.Choice.Paper)
        ) {
            return 1; // Player 1 wins
        }

        return 2; // Player 2 wins
    }

    /**
     * @notice Generate commit hash from choice and salt
     * @param choice The player's choice
     * @param salt Random salt for hiding the choice
     * @return hash The commit hash
     */
    function generateCommitHash(
        IBaseRPS.Choice choice,
        bytes32 salt
    ) internal pure returns (bytes32 hash) {
        return keccak256(abi.encodePacked(uint8(choice), salt));
    }

    /**
     * @notice Verify a commit hash against revealed choice and salt
     * @param commitHash The original commit hash
     * @param choice The revealed choice
     * @param salt The revealed salt
     * @return valid Whether the reveal is valid
     */
    function verifyCommit(
        bytes32 commitHash,
        IBaseRPS.Choice choice,
        bytes32 salt
    ) internal pure returns (bool valid) {
        return commitHash == generateCommitHash(choice, salt);
    }

    /**
     * @notice Get the number of wins required for a game mode
     * @param mode The game mode
     * @return wins Number of wins required
     */
    function getWinsRequired(
        IBaseRPS.GameMode mode
    ) internal pure returns (uint8 wins) {
        if (mode == IBaseRPS.GameMode.BO1) return 1;
        if (mode == IBaseRPS.GameMode.BO3) return 2;
        if (mode == IBaseRPS.GameMode.BO5) return 3;
        revert("RPSLib: Invalid game mode");
    }

    /**
     * @notice Check if a choice is valid (Rock, Paper, or Scissors)
     * @param choice The choice to validate
     * @return valid Whether the choice is valid
     */
    function isValidChoice(
        IBaseRPS.Choice choice
    ) internal pure returns (bool valid) {
        return choice == IBaseRPS.Choice.Rock ||
               choice == IBaseRPS.Choice.Paper ||
               choice == IBaseRPS.Choice.Scissors;
    }

    /**
     * @notice Generate hash for private match code
     * @param code The private code string
     * @return hash The code hash
     */
    function hashPrivateCode(
        string memory code
    ) internal pure returns (bytes32 hash) {
        return keccak256(abi.encodePacked(code));
    }
}
