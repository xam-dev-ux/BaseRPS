// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./interfaces/IBaseRPS.sol";
import "./libraries/RPSLib.sol";

/**
 * @title BaseRPS
 * @notice Rock Paper Scissors PvP game with commit-reveal mechanics and overtime system
 * @dev Deployed on Base Mainnet
 */
contract BaseRPS is IBaseRPS, ReentrancyGuard, Pausable, Ownable2Step {
    using RPSLib for IBaseRPS.Choice;

    // ============ Constants ============

    /// @notice Maximum consecutive ties before forced draw
    uint8 public constant MAX_TIES_PER_ROUND = 10;

    /// @notice Maximum commission rate (10% = 1000 basis points)
    uint256 public constant MAX_COMMISSION_RATE = 1000;

    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;

    // ============ State Variables ============

    /// @notice Current match ID counter
    uint256 public matchCounter;

    /// @notice Commission rate in basis points (250 = 2.5%)
    uint256 public commissionRate;

    /// @notice Minimum bet amount
    uint256 public minBet;

    /// @notice Maximum bet amount
    uint256 public maxBet;

    /// @notice Commit timeout in seconds
    uint40 public commitTimeout;

    /// @notice Reveal timeout in seconds
    uint40 public revealTimeout;

    /// @notice Match expiry time in seconds (for waiting matches)
    uint40 public matchExpiry;

    /// @notice Commission wallet addresses
    address[] public commissionWallets;

    /// @notice Match data by ID
    mapping(uint256 => Match) private matches;

    /// @notice Round state by match ID and round number
    mapping(uint256 => mapping(uint8 => RoundState)) private roundStates;

    /// @notice Player statistics
    mapping(address => PlayerStats) private playerStats;

    /// @notice Active matches for a player
    mapping(address => uint256[]) private activeMatchesByPlayer;

    /// @notice Open match IDs (available to join)
    uint256[] private openMatchIds;

    /// @notice Index of match in openMatchIds array (matchId => index + 1, 0 means not present)
    mapping(uint256 => uint256) private openMatchIndex;

    // ============ Constructor ============

    /**
     * @notice Initialize the contract
     * @param _commissionWallets Array of commission wallet addresses
     * @param _commissionRate Commission rate in basis points
     * @param _minBet Minimum bet amount
     * @param _maxBet Maximum bet amount
     */
    constructor(
        address[] memory _commissionWallets,
        uint256 _commissionRate,
        uint256 _minBet,
        uint256 _maxBet
    ) Ownable(msg.sender) {
        require(_commissionWallets.length > 0, "No commission wallets");
        require(_commissionRate <= MAX_COMMISSION_RATE, "Commission too high");
        require(_minBet > 0, "Min bet must be > 0");
        require(_maxBet >= _minBet, "Max bet must be >= min bet");

        for (uint256 i = 0; i < _commissionWallets.length; i++) {
            require(_commissionWallets[i] != address(0), "Invalid wallet");
        }

        commissionWallets = _commissionWallets;
        commissionRate = _commissionRate;
        minBet = _minBet;
        maxBet = _maxBet;

        // Default timeouts
        commitTimeout = 60; // 60 seconds
        revealTimeout = 60; // 60 seconds
        matchExpiry = 24 hours;
    }

    // ============ Match Management ============

    /**
     * @notice Create a new match
     * @param gameMode Game mode (BO1, BO3, BO5)
     * @param isPrivate Whether the match is private
     * @param privateCodeHash Hash of private code (if private)
     * @return matchId The created match ID
     */
    function createMatch(
        GameMode gameMode,
        bool isPrivate,
        bytes32 privateCodeHash
    ) external payable whenNotPaused nonReentrant returns (uint256 matchId) {
        require(msg.value >= minBet && msg.value <= maxBet, "Invalid bet amount");
        if (isPrivate) {
            require(privateCodeHash != bytes32(0), "Private code required");
        }

        matchId = ++matchCounter;

        Match storage m = matches[matchId];
        m.player1 = msg.sender;
        m.betAmount = msg.value;
        m.createdAt = uint40(block.timestamp);
        m.expiresAt = uint40(block.timestamp) + matchExpiry;
        m.currentRound = 1;
        m.gameMode = gameMode;
        m.state = MatchState.WaitingForP2;
        m.isPrivate = isPrivate;
        m.privateCodeHash = privateCodeHash;

        // Add to player's active matches
        activeMatchesByPlayer[msg.sender].push(matchId);

        // Add to open matches if public
        if (!isPrivate) {
            _addToOpenMatches(matchId);
        }

        emit MatchCreated(matchId, msg.sender, msg.value, gameMode, isPrivate);
    }

    /**
     * @notice Join a public match
     * @param matchId The match to join
     */
    function joinMatch(uint256 matchId) external payable whenNotPaused nonReentrant {
        Match storage m = matches[matchId];

        require(m.state == MatchState.WaitingForP2, "Cannot join match");
        require(!m.isPrivate, "Match is private");
        require(m.player1 != msg.sender, "Cannot join own match");
        require(msg.value == m.betAmount, "Incorrect bet amount");
        require(block.timestamp < m.expiresAt, "Match expired");

        _joinMatch(matchId, m);
    }

    /**
     * @notice Join a private match with code
     * @param matchId The match to join
     * @param privateCode The private code
     */
    function joinPrivateMatch(
        uint256 matchId,
        string calldata privateCode
    ) external payable whenNotPaused nonReentrant {
        Match storage m = matches[matchId];

        require(m.state == MatchState.WaitingForP2, "Cannot join match");
        require(m.isPrivate, "Match is not private");
        require(m.player1 != msg.sender, "Cannot join own match");
        require(msg.value == m.betAmount, "Incorrect bet amount");
        require(block.timestamp < m.expiresAt, "Match expired");
        require(
            RPSLib.hashPrivateCode(privateCode) == m.privateCodeHash,
            "Invalid private code"
        );

        _joinMatch(matchId, m);
    }

    /**
     * @notice Internal join match logic
     */
    function _joinMatch(uint256 matchId, Match storage m) internal {
        m.player2 = msg.sender;
        m.state = MatchState.BothJoined;

        // Set commit deadline for round 1
        RoundState storage rs = roundStates[matchId][1];
        rs.commitDeadline = uint40(block.timestamp) + commitTimeout;

        // Add to player's active matches
        activeMatchesByPlayer[msg.sender].push(matchId);

        // Remove from open matches
        _removeFromOpenMatches(matchId);

        emit MatchJoined(matchId, msg.sender);
    }

    /**
     * @notice Cancel a match that hasn't started
     * @param matchId The match to cancel
     */
    function cancelMatch(uint256 matchId) external nonReentrant {
        Match storage m = matches[matchId];

        require(m.player1 == msg.sender, "Not match creator");
        require(m.state == MatchState.WaitingForP2, "Cannot cancel");

        m.state = MatchState.Cancelled;
        _removeFromOpenMatches(matchId);
        _removeFromActiveMatches(msg.sender, matchId);

        uint256 refund = m.betAmount;
        m.betAmount = 0;

        (bool success, ) = msg.sender.call{value: refund}("");
        require(success, "Refund failed");

        emit MatchCancelled(matchId, msg.sender, refund);
    }

    // ============ Commit-Reveal ============

    /**
     * @notice Commit a choice hash
     * @param matchId The match ID
     * @param commitHash Hash of (choice, salt)
     */
    function commitChoice(
        uint256 matchId,
        bytes32 commitHash
    ) external whenNotPaused {
        Match storage m = matches[matchId];
        RoundState storage rs = roundStates[matchId][m.currentRound];

        require(
            m.state == MatchState.BothJoined ||
            m.state == MatchState.BothCommitted,
            "Invalid state for commit"
        );
        require(
            msg.sender == m.player1 || msg.sender == m.player2,
            "Not a player"
        );
        require(commitHash != bytes32(0), "Invalid commit hash");

        bool isPlayer1 = msg.sender == m.player1;

        if (isPlayer1) {
            require(rs.p1Commit == bytes32(0), "Already committed");
            rs.p1Commit = commitHash;
        } else {
            require(rs.p2Commit == bytes32(0), "Already committed");
            rs.p2Commit = commitHash;
        }

        emit ChoiceCommitted(matchId, msg.sender, m.currentRound);

        // Check if both committed
        if (rs.p1Commit != bytes32(0) && rs.p2Commit != bytes32(0)) {
            m.state = MatchState.BothCommitted;
            rs.revealDeadline = uint40(block.timestamp) + revealTimeout;
        }
    }

    /**
     * @notice Reveal a committed choice
     * @param matchId The match ID
     * @param choice The revealed choice
     * @param salt The salt used in commit
     */
    function revealChoice(
        uint256 matchId,
        Choice choice,
        bytes32 salt
    ) external whenNotPaused nonReentrant {
        Match storage m = matches[matchId];
        RoundState storage rs = roundStates[matchId][m.currentRound];

        require(m.state == MatchState.BothCommitted ||
                m.state == MatchState.P1Revealed ||
                m.state == MatchState.P2Revealed,
                "Invalid state for reveal");
        require(
            msg.sender == m.player1 || msg.sender == m.player2,
            "Not a player"
        );
        require(RPSLib.isValidChoice(choice), "Invalid choice");

        bool isPlayer1 = msg.sender == m.player1;
        bytes32 commitHash = isPlayer1 ? rs.p1Commit : rs.p2Commit;

        require(
            RPSLib.verifyCommit(commitHash, choice, salt),
            "Invalid reveal"
        );

        if (isPlayer1) {
            require(!rs.p1Revealed, "Already revealed");
            rs.p1Choice = choice;
            rs.p1Revealed = true;

            // Update stats
            _updateChoiceStats(msg.sender, choice);

            emit ChoiceRevealed(matchId, msg.sender, choice, m.currentRound);

            if (rs.p2Revealed) {
                _resolveRound(matchId);
            } else {
                m.state = MatchState.P1Revealed;
            }
        } else {
            require(!rs.p2Revealed, "Already revealed");
            rs.p2Choice = choice;
            rs.p2Revealed = true;

            // Update stats
            _updateChoiceStats(msg.sender, choice);

            emit ChoiceRevealed(matchId, msg.sender, choice, m.currentRound);

            if (rs.p1Revealed) {
                _resolveRound(matchId);
            } else {
                m.state = MatchState.P2Revealed;
            }
        }
    }

    // ============ Round Resolution ============

    /**
     * @notice Resolve the current round
     */
    function _resolveRound(uint256 matchId) internal {
        Match storage m = matches[matchId];
        RoundState storage rs = roundStates[matchId][m.currentRound];

        uint8 result = RPSLib.compare(rs.p1Choice, rs.p2Choice);
        bool isOvertime = rs.tieCount > 0;

        if (result == 0) {
            // TIE - Overtime
            rs.tieCount++;

            emit RoundResult(
                matchId,
                m.currentRound,
                address(0),
                rs.tieCount,
                true
            );

            if (rs.tieCount >= MAX_TIES_PER_ROUND) {
                // Force draw after 10 ties
                _endMatchDraw(matchId);
                return;
            }

            // Reset for overtime (same round)
            rs.p1Commit = bytes32(0);
            rs.p2Commit = bytes32(0);
            rs.p1Choice = Choice.None;
            rs.p2Choice = Choice.None;
            rs.p1Revealed = false;
            rs.p2Revealed = false;
            rs.commitDeadline = uint40(block.timestamp) + commitTimeout;
            rs.revealDeadline = 0;

            m.state = MatchState.BothJoined;
        } else {
            // We have a winner for this round
            address roundWinner;
            if (result == 1) {
                m.p1Wins++;
                roundWinner = m.player1;
            } else {
                m.p2Wins++;
                roundWinner = m.player2;
            }

            emit RoundResult(
                matchId,
                m.currentRound,
                roundWinner,
                rs.tieCount,
                isOvertime
            );

            // Check if match is over
            uint8 winsRequired = RPSLib.getWinsRequired(m.gameMode);

            if (m.p1Wins >= winsRequired) {
                _endMatchWithWinner(matchId, m.player1, isOvertime);
            } else if (m.p2Wins >= winsRequired) {
                _endMatchWithWinner(matchId, m.player2, isOvertime);
            } else {
                // Next round
                m.currentRound++;
                RoundState storage nextRs = roundStates[matchId][m.currentRound];
                nextRs.commitDeadline = uint40(block.timestamp) + commitTimeout;
                m.state = MatchState.BothJoined;
            }
        }
    }

    /**
     * @notice End match with a winner
     */
    function _endMatchWithWinner(
        uint256 matchId,
        address winner,
        bool hadOvertime
    ) internal {
        Match storage m = matches[matchId];
        m.state = MatchState.Completed;

        uint256 totalPot = m.betAmount * 2;
        uint256 commission = (totalPot * commissionRate) / BASIS_POINTS;
        uint256 winnerPayout = totalPot - commission;

        // Update stats
        address loser = winner == m.player1 ? m.player2 : m.player1;

        PlayerStats storage winnerStats = playerStats[winner];
        PlayerStats storage loserStats = playerStats[loser];

        winnerStats.totalMatches++;
        winnerStats.wins++;
        winnerStats.currentStreak++;
        if (winnerStats.currentStreak > winnerStats.bestStreak) {
            winnerStats.bestStreak = winnerStats.currentStreak;
        }

        loserStats.totalMatches++;
        loserStats.losses++;
        loserStats.currentStreak = 0;

        if (hadOvertime) {
            winnerStats.overtimeWins++;
            loserStats.overtimeLosses++;
        }

        // Remove from active matches
        _removeFromActiveMatches(m.player1, matchId);
        _removeFromActiveMatches(m.player2, matchId);

        // Distribute commission
        if (commission > 0) {
            _distributeCommission(commission);
        }

        // Pay winner
        (bool success, ) = winner.call{value: winnerPayout}("");
        require(success, "Winner payout failed");

        emit MatchCompleted(matchId, winner, winnerPayout, commission, false);
    }

    /**
     * @notice End match as a draw (10 ties)
     */
    function _endMatchDraw(uint256 matchId) internal {
        Match storage m = matches[matchId];
        m.state = MatchState.Completed;

        // Update stats
        PlayerStats storage p1Stats = playerStats[m.player1];
        PlayerStats storage p2Stats = playerStats[m.player2];

        p1Stats.totalMatches++;
        p1Stats.ties++;
        p2Stats.totalMatches++;
        p2Stats.ties++;

        // Remove from active matches
        _removeFromActiveMatches(m.player1, matchId);
        _removeFromActiveMatches(m.player2, matchId);

        // Full refund to both players (no commission on draws)
        uint256 refund = m.betAmount;

        (bool success1, ) = m.player1.call{value: refund}("");
        require(success1, "P1 refund failed");

        (bool success2, ) = m.player2.call{value: refund}("");
        require(success2, "P2 refund failed");

        emit MatchCompleted(matchId, address(0), 0, 0, true);
    }

    // ============ Timeout Claims ============

    /**
     * @notice Claim win due to opponent timeout
     * @param matchId The match ID
     */
    function claimTimeout(uint256 matchId) external nonReentrant {
        Match storage m = matches[matchId];
        RoundState storage rs = roundStates[matchId][m.currentRound];

        require(
            msg.sender == m.player1 || msg.sender == m.player2,
            "Not a player"
        );

        bool isPlayer1 = msg.sender == m.player1;
        address opponent = isPlayer1 ? m.player2 : m.player1;
        address winner;
        uint256 refund = m.betAmount * 2;

        // Check various timeout conditions
        if (m.state == MatchState.WaitingForP2) {
            // Match expired without opponent
            require(block.timestamp >= m.expiresAt, "Not expired yet");
            require(isPlayer1, "Only creator can claim");
            winner = m.player1;
            refund = m.betAmount; // Only creator's bet
        } else if (m.state == MatchState.BothJoined) {
            // Commit phase timeout
            require(
                block.timestamp > rs.commitDeadline,
                "Commit deadline not passed"
            );

            // Check who didn't commit
            if (isPlayer1) {
                require(rs.p1Commit != bytes32(0), "You didn't commit");
                require(rs.p2Commit == bytes32(0), "Opponent committed");
            } else {
                require(rs.p2Commit != bytes32(0), "You didn't commit");
                require(rs.p1Commit == bytes32(0), "Opponent committed");
            }

            winner = msg.sender;
        } else if (
            m.state == MatchState.BothCommitted ||
            m.state == MatchState.P1Revealed ||
            m.state == MatchState.P2Revealed
        ) {
            // Reveal phase timeout
            require(
                block.timestamp > rs.revealDeadline,
                "Reveal deadline not passed"
            );

            // Check who didn't reveal
            if (isPlayer1) {
                require(rs.p1Revealed, "You didn't reveal");
                require(!rs.p2Revealed, "Opponent revealed");
            } else {
                require(rs.p2Revealed, "You didn't reveal");
                require(!rs.p1Revealed, "Opponent revealed");
            }

            winner = msg.sender;
        } else {
            revert("Cannot claim timeout");
        }

        m.state = MatchState.Expired;

        // Update stats for timeout
        if (m.player2 != address(0)) {
            PlayerStats storage winnerStats = playerStats[winner];
            PlayerStats storage loserStats = playerStats[opponent];

            winnerStats.totalMatches++;
            winnerStats.wins++;
            winnerStats.currentStreak++;
            if (winnerStats.currentStreak > winnerStats.bestStreak) {
                winnerStats.bestStreak = winnerStats.currentStreak;
            }

            loserStats.totalMatches++;
            loserStats.losses++;
            loserStats.currentStreak = 0;
        }

        // Remove from active matches
        _removeFromActiveMatches(m.player1, matchId);
        if (m.player2 != address(0)) {
            _removeFromActiveMatches(m.player2, matchId);
        }
        _removeFromOpenMatches(matchId);

        // Pay winner
        (bool success, ) = winner.call{value: refund}("");
        require(success, "Payout failed");

        emit MatchExpired(matchId, winner, refund);
    }

    // ============ Commission Distribution ============

    /**
     * @notice Distribute commission to wallets
     */
    function _distributeCommission(uint256 totalCommission) internal {
        uint256 walletCount = commissionWallets.length;
        uint256 baseShare = totalCommission / walletCount;
        uint256 residue = totalCommission % walletCount;

        for (uint256 i = 0; i < walletCount; i++) {
            uint256 amount = baseShare + (i == 0 ? residue : 0);
            if (amount > 0) {
                (bool success, ) = commissionWallets[i].call{value: amount}("");
                require(success, "Commission transfer failed");
            }
        }
    }

    // ============ Internal Helpers ============

    function _updateChoiceStats(address player, Choice choice) internal {
        PlayerStats storage stats = playerStats[player];
        if (choice == Choice.Rock) stats.rockCount++;
        else if (choice == Choice.Paper) stats.paperCount++;
        else if (choice == Choice.Scissors) stats.scissorsCount++;
    }

    function _addToOpenMatches(uint256 matchId) internal {
        openMatchIds.push(matchId);
        openMatchIndex[matchId] = openMatchIds.length; // 1-indexed
    }

    function _removeFromOpenMatches(uint256 matchId) internal {
        uint256 idx = openMatchIndex[matchId];
        if (idx == 0) return; // Not in array

        uint256 lastIdx = openMatchIds.length - 1;
        if (idx - 1 != lastIdx) {
            // Swap with last element
            uint256 lastMatchId = openMatchIds[lastIdx];
            openMatchIds[idx - 1] = lastMatchId;
            openMatchIndex[lastMatchId] = idx;
        }

        openMatchIds.pop();
        delete openMatchIndex[matchId];
    }

    function _removeFromActiveMatches(address player, uint256 matchId) internal {
        uint256[] storage active = activeMatchesByPlayer[player];
        for (uint256 i = 0; i < active.length; i++) {
            if (active[i] == matchId) {
                active[i] = active[active.length - 1];
                active.pop();
                break;
            }
        }
    }

    // ============ View Functions ============

    function getMatch(uint256 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    function getRoundState(
        uint256 matchId,
        uint8 round
    ) external view returns (RoundState memory) {
        return roundStates[matchId][round];
    }

    function getPlayerStats(
        address player
    ) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    function getActiveMatches(
        address player
    ) external view returns (uint256[] memory) {
        return activeMatchesByPlayer[player];
    }

    function getOpenMatches(
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory) {
        uint256 total = openMatchIds.length;
        if (offset >= total) {
            return new uint256[](0);
        }

        uint256 end = offset + limit;
        if (end > total) end = total;

        uint256[] memory result = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = openMatchIds[i];
        }

        return result;
    }

    function getWinsRequired(GameMode mode) external pure returns (uint8) {
        return RPSLib.getWinsRequired(mode);
    }

    function getOpenMatchCount() external view returns (uint256) {
        return openMatchIds.length;
    }

    function getCommissionWallets() external view returns (address[] memory) {
        return commissionWallets;
    }

    // ============ Admin Functions ============

    function setCommissionWallets(
        address[] calldata wallets
    ) external onlyOwner {
        require(wallets.length > 0, "No wallets");
        for (uint256 i = 0; i < wallets.length; i++) {
            require(wallets[i] != address(0), "Invalid wallet");
        }
        commissionWallets = wallets;
        emit CommissionWalletsUpdated(wallets);
    }

    function setCommissionRate(uint256 rate) external onlyOwner {
        require(rate <= MAX_COMMISSION_RATE, "Rate too high");
        uint256 oldRate = commissionRate;
        commissionRate = rate;
        emit CommissionRateUpdated(oldRate, rate);
    }

    function setBetLimits(
        uint256 _minBet,
        uint256 _maxBet
    ) external onlyOwner {
        require(_minBet > 0, "Min bet must be > 0");
        require(_maxBet >= _minBet, "Max must be >= min");
        minBet = _minBet;
        maxBet = _maxBet;
    }

    function setTimeouts(
        uint40 _commitTimeout,
        uint40 _revealTimeout,
        uint40 _matchExpiry
    ) external onlyOwner {
        require(_commitTimeout >= 30, "Commit timeout too short");
        require(_revealTimeout >= 30, "Reveal timeout too short");
        require(_matchExpiry >= 1 hours, "Match expiry too short");
        commitTimeout = _commitTimeout;
        revealTimeout = _revealTimeout;
        matchExpiry = _matchExpiry;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
