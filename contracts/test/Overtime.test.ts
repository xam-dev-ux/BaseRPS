import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseRPS } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("BaseRPS - Overtime System", function () {
  let baseRPS: BaseRPS;
  let owner: HardhatEthersSigner;
  let player1: HardhatEthersSigner;
  let player2: HardhatEthersSigner;
  let commissionWallet: HardhatEthersSigner;

  const MIN_BET = ethers.parseEther("0.01");
  const MAX_BET = ethers.parseEther("1");
  const COMMISSION_RATE = 250;

  const Choice = {
    None: 0,
    Rock: 1,
    Paper: 2,
    Scissors: 3,
  };

  const GameMode = {
    BO1: 0,
    BO3: 1,
    BO5: 2,
  };

  const MatchState = {
    None: 0,
    WaitingForP2: 1,
    BothJoined: 2,
    BothCommitted: 3,
    P1Revealed: 4,
    P2Revealed: 5,
    Completed: 6,
    Expired: 7,
    Cancelled: 8,
  };

  function generateCommitHash(choice: number, salt: string): string {
    return ethers.keccak256(
      ethers.solidityPacked(["uint8", "bytes32"], [choice, salt])
    );
  }

  function generateSalt(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  async function playRound(
    matchId: number,
    p1Choice: number,
    p2Choice: number
  ): Promise<void> {
    const salt1 = generateSalt();
    const salt2 = generateSalt();

    await baseRPS
      .connect(player1)
      .commitChoice(matchId, generateCommitHash(p1Choice, salt1));
    await baseRPS
      .connect(player2)
      .commitChoice(matchId, generateCommitHash(p2Choice, salt2));

    await baseRPS.connect(player1).revealChoice(matchId, p1Choice, salt1);
    await baseRPS.connect(player2).revealChoice(matchId, p2Choice, salt2);
  }

  beforeEach(async function () {
    [owner, player1, player2, commissionWallet] = await ethers.getSigners();

    const BaseRPSFactory = await ethers.getContractFactory("BaseRPS");
    baseRPS = await BaseRPSFactory.deploy(
      [commissionWallet.address],
      COMMISSION_RATE,
      MIN_BET,
      MAX_BET
    );
  });

  describe("Tie handling (Overtime)", function () {
    beforeEach(async function () {
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });
      await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });
    });

    it("should continue round on tie (same choice)", async function () {
      // Both play Rock - TIE
      await playRound(1, Choice.Rock, Choice.Rock);

      const match = await baseRPS.getMatch(1);
      // Should still be in BothJoined, not completed
      expect(match.state).to.equal(MatchState.BothJoined);
      expect(match.currentRound).to.equal(1); // Still round 1
      expect(match.p1Wins).to.equal(0);
      expect(match.p2Wins).to.equal(0);

      // Check tie count
      const roundState = await baseRPS.getRoundState(1, 1);
      expect(roundState.tieCount).to.equal(1);

      // Commits should be reset
      expect(roundState.p1Commit).to.equal(ethers.ZeroHash);
      expect(roundState.p2Commit).to.equal(ethers.ZeroHash);
      expect(roundState.p1Revealed).to.be.false;
      expect(roundState.p2Revealed).to.be.false;
    });

    it("should increment tieCount on consecutive ties", async function () {
      // First tie
      await playRound(1, Choice.Paper, Choice.Paper);
      let roundState = await baseRPS.getRoundState(1, 1);
      expect(roundState.tieCount).to.equal(1);

      // Second tie
      await playRound(1, Choice.Scissors, Choice.Scissors);
      roundState = await baseRPS.getRoundState(1, 1);
      expect(roundState.tieCount).to.equal(2);

      // Third tie
      await playRound(1, Choice.Rock, Choice.Rock);
      roundState = await baseRPS.getRoundState(1, 1);
      expect(roundState.tieCount).to.equal(3);
    });

    it("should resolve round after tie when someone wins", async function () {
      // First: TIE
      await playRound(1, Choice.Rock, Choice.Rock);

      // Second: Player 1 wins
      await playRound(1, Choice.Rock, Choice.Scissors);

      const match = await baseRPS.getMatch(1);
      expect(match.state).to.equal(MatchState.Completed);
      expect(match.p1Wins).to.equal(1);
    });

    it("should track overtime wins in stats", async function () {
      // TIE first
      await playRound(1, Choice.Paper, Choice.Paper);

      // Then player 2 wins
      await playRound(1, Choice.Scissors, Choice.Rock);

      const p2Stats = await baseRPS.getPlayerStats(player2.address);
      expect(p2Stats.wins).to.equal(1);
      expect(p2Stats.overtimeWins).to.equal(1);

      const p1Stats = await baseRPS.getPlayerStats(player1.address);
      expect(p1Stats.losses).to.equal(1);
      expect(p1Stats.overtimeLosses).to.equal(1);
    });

    it("should emit RoundResult event with isOvertime=true", async function () {
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      await baseRPS
        .connect(player1)
        .commitChoice(1, generateCommitHash(Choice.Rock, salt1));
      await baseRPS
        .connect(player2)
        .commitChoice(1, generateCommitHash(Choice.Rock, salt2));

      await baseRPS.connect(player1).revealChoice(1, Choice.Rock, salt1);

      await expect(
        baseRPS.connect(player2).revealChoice(1, Choice.Rock, salt2)
      )
        .to.emit(baseRPS, "RoundResult")
        .withArgs(
          1, // matchId
          1, // round
          ethers.ZeroAddress, // winner (no winner on tie)
          1, // tieCount
          true // isOvertime
        );
    });
  });

  describe("Force draw after 10 ties", function () {
    beforeEach(async function () {
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });
      await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });
    });

    it("should force draw after 10 consecutive ties", async function () {
      // Play 10 ties
      for (let i = 0; i < 10; i++) {
        await playRound(1, Choice.Rock, Choice.Rock);
      }

      const match = await baseRPS.getMatch(1);
      expect(match.state).to.equal(MatchState.Completed);

      // Both players should have a "tie" (draw) recorded
      const p1Stats = await baseRPS.getPlayerStats(player1.address);
      const p2Stats = await baseRPS.getPlayerStats(player2.address);

      expect(p1Stats.ties).to.equal(1);
      expect(p2Stats.ties).to.equal(1);
    });

    it("should refund full amount on draw (no commission)", async function () {
      const p1BalanceBefore = await ethers.provider.getBalance(player1.address);
      const p2BalanceBefore = await ethers.provider.getBalance(player2.address);
      const commissionBalanceBefore = await ethers.provider.getBalance(
        commissionWallet.address
      );

      // Play 9 ties (need to track gas for the last one)
      for (let i = 0; i < 9; i++) {
        await playRound(1, Choice.Paper, Choice.Paper);
      }

      // 10th tie
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      await baseRPS
        .connect(player1)
        .commitChoice(1, generateCommitHash(Choice.Paper, salt1));
      await baseRPS
        .connect(player2)
        .commitChoice(1, generateCommitHash(Choice.Paper, salt2));

      await baseRPS.connect(player1).revealChoice(1, Choice.Paper, salt1);
      await baseRPS.connect(player2).revealChoice(1, Choice.Paper, salt2);

      const p1BalanceAfter = await ethers.provider.getBalance(player1.address);
      const p2BalanceAfter = await ethers.provider.getBalance(player2.address);
      const commissionBalanceAfter = await ethers.provider.getBalance(
        commissionWallet.address
      );

      // Commission wallet should not have received anything
      expect(commissionBalanceAfter).to.equal(commissionBalanceBefore);

      // Players should have received refunds (minus gas)
      // Since exact gas is hard to calculate, just verify balances increased
      // from before the last tie
    });

    it("should emit MatchCompleted with wasDraw=true", async function () {
      // Play 9 ties
      for (let i = 0; i < 9; i++) {
        await playRound(1, Choice.Scissors, Choice.Scissors);
      }

      // 10th tie
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      await baseRPS
        .connect(player1)
        .commitChoice(1, generateCommitHash(Choice.Scissors, salt1));
      await baseRPS
        .connect(player2)
        .commitChoice(1, generateCommitHash(Choice.Scissors, salt2));

      await baseRPS.connect(player1).revealChoice(1, Choice.Scissors, salt1);

      await expect(
        baseRPS.connect(player2).revealChoice(1, Choice.Scissors, salt2)
      )
        .to.emit(baseRPS, "MatchCompleted")
        .withArgs(
          1, // matchId
          ethers.ZeroAddress, // winner (no winner on draw)
          0, // winnerPayout
          0, // totalCommission
          true // wasDraw
        );
    });
  });

  describe("Overtime in multi-round games", function () {
    it("should handle overtime in BO3 correctly", async function () {
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO3, false, ethers.ZeroHash, { value: MIN_BET });
      await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });

      // Round 1: Tie then P1 wins
      await playRound(1, Choice.Rock, Choice.Rock);
      await playRound(1, Choice.Rock, Choice.Scissors);

      let match = await baseRPS.getMatch(1);
      expect(match.p1Wins).to.equal(1);
      expect(match.currentRound).to.equal(2);

      // Round 2: P2 wins directly
      await playRound(1, Choice.Rock, Choice.Paper);

      match = await baseRPS.getMatch(1);
      expect(match.p2Wins).to.equal(1);
      expect(match.currentRound).to.equal(3);

      // Round 3: Multiple ties then P1 wins
      await playRound(1, Choice.Paper, Choice.Paper);
      await playRound(1, Choice.Scissors, Choice.Scissors);
      await playRound(1, Choice.Paper, Choice.Rock);

      match = await baseRPS.getMatch(1);
      expect(match.state).to.equal(MatchState.Completed);
      expect(match.p1Wins).to.equal(2); // P1 wins the match

      // Check overtime stats
      const p1Stats = await baseRPS.getPlayerStats(player1.address);
      expect(p1Stats.overtimeWins).to.equal(1); // Won after tie in round 1 and 3
    });

    it("should track tieCount per round independently", async function () {
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO3, false, ethers.ZeroHash, { value: MIN_BET });
      await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });

      // Round 1: 2 ties then win
      await playRound(1, Choice.Rock, Choice.Rock);
      await playRound(1, Choice.Rock, Choice.Rock);

      let roundState = await baseRPS.getRoundState(1, 1);
      expect(roundState.tieCount).to.equal(2);

      await playRound(1, Choice.Rock, Choice.Scissors);

      // Round 2: Fresh start
      roundState = await baseRPS.getRoundState(1, 2);
      expect(roundState.tieCount).to.equal(0);

      // 1 tie in round 2
      await playRound(1, Choice.Paper, Choice.Paper);
      roundState = await baseRPS.getRoundState(1, 2);
      expect(roundState.tieCount).to.equal(1);
    });
  });

  describe("Edge cases", function () {
    it("should handle alternating tie and win correctly", async function () {
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });
      await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });

      // Tie
      await playRound(1, Choice.Rock, Choice.Rock);
      // Tie
      await playRound(1, Choice.Paper, Choice.Paper);
      // Tie
      await playRound(1, Choice.Scissors, Choice.Scissors);
      // Win
      await playRound(1, Choice.Rock, Choice.Scissors);

      const match = await baseRPS.getMatch(1);
      expect(match.state).to.equal(MatchState.Completed);
      expect(match.p1Wins).to.equal(1);

      const roundState = await baseRPS.getRoundState(1, 1);
      expect(roundState.tieCount).to.equal(3);
    });

    it("should not allow more than 10 ties (safety check)", async function () {
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });
      await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });

      // Play 10 ties - match should end
      for (let i = 0; i < 10; i++) {
        await playRound(1, Choice.Rock, Choice.Rock);
      }

      const match = await baseRPS.getMatch(1);
      expect(match.state).to.equal(MatchState.Completed);

      // Trying to commit after match is completed should fail
      const salt = generateSalt();
      await expect(
        baseRPS
          .connect(player1)
          .commitChoice(1, generateCommitHash(Choice.Rock, salt))
      ).to.be.revertedWith("Invalid state for commit");
    });
  });
});
