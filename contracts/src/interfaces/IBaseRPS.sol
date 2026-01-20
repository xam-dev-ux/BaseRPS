// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBaseRPS
 * @notice Interface for the BaseRPS Rock Paper Scissors game contract
 */
interface IBaseRPS {
    // ============ Enums ============

    /// @notice Player choice in the game
    enum Choice {
        None,
        Rock,
        Paper,
        Scissors
    }

    /// @notice State of a match
    enum MatchState {
        None,           // Match doesn't exist
        WaitingForP2,   // Created, waiting for opponent
        BothJoined,     // Both players in, waiting for commits
        BothCommitted,  // Both committed, waiting for reveals
        P1Revealed,     // Player 1 revealed, waiting for P2
        P2Revealed,     // Player 2 revealed, waiting for P1
        Completed,      // Match ended with a winner or draw
        Expired,        // Match timed out
        Cancelled       // Match cancelled by creator
    }

    /// @notice Game mode determining wins needed
    enum GameMode {
        BO1,    // Best of 1 - first to 1 win
        BO3,    // Best of 3 - first to 2 wins
        BO5     // Best of 5 - first to 3 wins
    }

    // ============ Structs ============

    /// @notice Match data
    struct Match {
        address player1;        // Match creator
        address player2;        // Opponent
        uint256 betAmount;      // Bet per player
        uint40 createdAt;       // Creation timestamp
        uint40 expiresAt;       // Match expiry timestamp
        uint8 p1Wins;           // Player 1 round wins
        uint8 p2Wins;           // Player 2 round wins
        uint8 currentRound;     // Current round number (1-indexed)
        GameMode gameMode;      // BO1, BO3, or BO5
        MatchState state;       // Current match state
        bool isPrivate;         // Private match flag
        bytes32 privateCodeHash; // Hash of private code
    }

    /// @notice Round state for commit-reveal
    struct RoundState {
        bytes32 p1Commit;       // Player 1's commit hash
        bytes32 p2Commit;       // Player 2's commit hash
        Choice p1Choice;        // Player 1's revealed choice
        Choice p2Choice;        // Player 2's revealed choice
        uint8 tieCount;         // Consecutive ties in this round (overtime)
        uint40 commitDeadline;  // Deadline for commits
        uint40 revealDeadline;  // Deadline for reveals
        bool p1Revealed;        // Player 1 revealed flag
        bool p2Revealed;        // Player 2 revealed flag
    }

    /// @notice Player statistics
    struct PlayerStats {
        uint32 totalMatches;    // Total matches played
        uint32 wins;            // Total wins
        uint32 losses;          // Total losses
        uint32 ties;            // Draws (10 consecutive ties)
        uint32 currentStreak;   // Current win streak
        uint32 bestStreak;      // Best win streak ever
        uint32 overtimeWins;    // Wins after at least 1 tie
        uint32 overtimeLosses;  // Losses after at least 1 tie
        uint32 rockCount;       // Times played Rock
        uint32 paperCount;      // Times played Paper
        uint32 scissorsCount;   // Times played Scissors
    }

    // ============ Events ============

    /// @notice Emitted when a match is created
    event MatchCreated(
        uint256 indexed matchId,
        address indexed player1,
        uint256 betAmount,
        GameMode gameMode,
        bool isPrivate
    );

    /// @notice Emitted when a player joins a match
    event MatchJoined(
        uint256 indexed matchId,
        address indexed player2
    );

    /// @notice Emitted when a player commits their choice
    event ChoiceCommitted(
        uint256 indexed matchId,
        address indexed player,
        uint8 round
    );

    /// @notice Emitted when a player reveals their choice
    event ChoiceRevealed(
        uint256 indexed matchId,
        address indexed player,
        Choice choice,
        uint8 round
    );

    /// @notice Emitted when a round is resolved
    event RoundResult(
        uint256 indexed matchId,
        uint8 round,
        address winner,         // address(0) for tie
        uint8 tieCount,         // Current tie count
        bool isOvertime         // Whether this was an overtime round
    );

    /// @notice Emitted when a match is completed
    event MatchCompleted(
        uint256 indexed matchId,
        address indexed winner,     // address(0) for draw
        uint256 winnerPayout,
        uint256 totalCommission,
        bool wasDraw
    );

    /// @notice Emitted when a match expires due to timeout
    event MatchExpired(
        uint256 indexed matchId,
        address indexed winner,
        uint256 refundAmount
    );

    /// @notice Emitted when a match is cancelled
    event MatchCancelled(
        uint256 indexed matchId,
        address indexed player1,
        uint256 refundAmount
    );

    /// @notice Emitted when commission wallets are updated
    event CommissionWalletsUpdated(
        address[] wallets
    );

    /// @notice Emitted when commission rate is updated
    event CommissionRateUpdated(
        uint256 oldRate,
        uint256 newRate
    );

    // ============ Functions ============

    // Match Management
    function createMatch(
        GameMode gameMode,
        bool isPrivate,
        bytes32 privateCodeHash
    ) external payable returns (uint256 matchId);

    function joinMatch(uint256 matchId) external payable;

    function joinPrivateMatch(
        uint256 matchId,
        string calldata privateCode
    ) external payable;

    function cancelMatch(uint256 matchId) external;

    // Commit-Reveal
    function commitChoice(
        uint256 matchId,
        bytes32 commitHash
    ) external;

    function revealChoice(
        uint256 matchId,
        Choice choice,
        bytes32 salt
    ) external;

    // Timeout Claims
    function claimTimeout(uint256 matchId) external;

    // View Functions
    function getMatch(uint256 matchId) external view returns (Match memory);

    function getRoundState(
        uint256 matchId,
        uint8 round
    ) external view returns (RoundState memory);

    function getPlayerStats(
        address player
    ) external view returns (PlayerStats memory);

    function getActiveMatches(
        address player
    ) external view returns (uint256[] memory);

    function getOpenMatches(
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory);

    function getWinsRequired(GameMode mode) external pure returns (uint8);

    // Admin Functions
    function setCommissionWallets(address[] calldata wallets) external;

    function setCommissionRate(uint256 rate) external;

    function setBetLimits(uint256 minBet, uint256 maxBet) external;

    function setTimeouts(
        uint40 commitTimeout,
        uint40 revealTimeout,
        uint40 matchExpiry
    ) external;

    function pause() external;

    function unpause() external;
}
