import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseRPS } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("BaseRPS", function () {
  let baseRPS: BaseRPS;
  let owner: HardhatEthersSigner;
  let player1: HardhatEthersSigner;
  let player2: HardhatEthersSigner;
  let commissionWallet1: HardhatEthersSigner;
  let commissionWallet2: HardhatEthersSigner;

  const MIN_BET = ethers.parseEther("0.01");
  const MAX_BET = ethers.parseEther("1");
  const COMMISSION_RATE = 250; // 2.5%

  // Choice enum values
  const Choice = {
    None: 0,
    Rock: 1,
    Paper: 2,
    Scissors: 3,
  };

  // GameMode enum values
  const GameMode = {
    BO1: 0,
    BO3: 1,
    BO5: 2,
  };

  // MatchState enum values
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

  // Helper to generate commit hash
  function generateCommitHash(choice: number, salt: string): string {
    return ethers.keccak256(
      ethers.solidityPacked(["uint8", "bytes32"], [choice, salt])
    );
  }

  // Helper to generate random salt
  function generateSalt(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  beforeEach(async function () {
    [owner, player1, player2, commissionWallet1, commissionWallet2] =
      await ethers.getSigners();

    const BaseRPSFactory = await ethers.getContractFactory("BaseRPS");
    baseRPS = await BaseRPSFactory.deploy(
      [commissionWallet1.address, commissionWallet2.address],
      COMMISSION_RATE,
      MIN_BET,
      MAX_BET
    );
  });

  describe("Deployment", function () {
    it("should set correct initial values", async function () {
      expect(await baseRPS.minBet()).to.equal(MIN_BET);
      expect(await baseRPS.maxBet()).to.equal(MAX_BET);
      expect(await baseRPS.commissionRate()).to.equal(COMMISSION_RATE);
      expect(await baseRPS.owner()).to.equal(owner.address);
    });

    it("should set commission wallets", async function () {
      const wallets = await baseRPS.getCommissionWallets();
      expect(wallets).to.deep.equal([
        commissionWallet1.address,
        commissionWallet2.address,
      ]);
    });
  });

  describe("createMatch", function () {
    it("should create a public BO1 match", async function () {
      const tx = await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, {
          value: MIN_BET,
        });

      await expect(tx)
        .to.emit(baseRPS, "MatchCreated")
        .withArgs(1, player1.address, MIN_BET, GameMode.BO1, false);

      const match = await baseRPS.getMatch(1);
      expect(match.player1).to.equal(player1.address);
      expect(match.player2).to.equal(ethers.ZeroAddress);
      expect(match.betAmount).to.equal(MIN_BET);
      expect(match.state).to.equal(MatchState.WaitingForP2);
      expect(match.gameMode).to.equal(GameMode.BO1);
      expect(match.isPrivate).to.be.false;
    });

    it("should create a private match with code hash", async function () {
      const privateCode = "secret123";
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(privateCode));

      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO3, true, codeHash, { value: MIN_BET });

      const match = await baseRPS.getMatch(1);
      expect(match.isPrivate).to.be.true;
      expect(match.privateCodeHash).to.equal(codeHash);
    });

    it("should reject bet below minimum", async function () {
      await expect(
        baseRPS.connect(player1).createMatch(GameMode.BO1, false, ethers.ZeroHash, {
          value: ethers.parseEther("0.001"),
        })
      ).to.be.revertedWith("Invalid bet amount");
    });

    it("should reject bet above maximum", async function () {
      await expect(
        baseRPS.connect(player1).createMatch(GameMode.BO1, false, ethers.ZeroHash, {
          value: ethers.parseEther("2"),
        })
      ).to.be.revertedWith("Invalid bet amount");
    });

    it("should add to open matches list", async function () {
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });

      expect(await baseRPS.getOpenMatchCount()).to.equal(1);
      const openMatches = await baseRPS.getOpenMatches(0, 10);
      expect(openMatches).to.deep.equal([1n]);
    });
  });

  describe("joinMatch", function () {
    beforeEach(async function () {
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });
    });

    it("should allow joining a public match", async function () {
      const tx = await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });

      await expect(tx).to.emit(baseRPS, "MatchJoined").withArgs(1, player2.address);

      const match = await baseRPS.getMatch(1);
      expect(match.player2).to.equal(player2.address);
      expect(match.state).to.equal(MatchState.BothJoined);
    });

    it("should remove from open matches", async function () {
      await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });
      expect(await baseRPS.getOpenMatchCount()).to.equal(0);
    });

    it("should reject incorrect bet amount", async function () {
      await expect(
        baseRPS.connect(player2).joinMatch(1, { value: MIN_BET + 1n })
      ).to.be.revertedWith("Incorrect bet amount");
    });

    it("should reject creator joining own match", async function () {
      await expect(
        baseRPS.connect(player1).joinMatch(1, { value: MIN_BET })
      ).to.be.revertedWith("Cannot join own match");
    });
  });

  describe("joinPrivateMatch", function () {
    const privateCode = "secret123";
    let codeHash: string;

    beforeEach(async function () {
      codeHash = ethers.keccak256(ethers.toUtf8Bytes(privateCode));
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, true, codeHash, { value: MIN_BET });
    });

    it("should allow joining with correct code", async function () {
      await baseRPS
        .connect(player2)
        .joinPrivateMatch(1, privateCode, { value: MIN_BET });

      const match = await baseRPS.getMatch(1);
      expect(match.player2).to.equal(player2.address);
    });

    it("should reject wrong code", async function () {
      await expect(
        baseRPS.connect(player2).joinPrivateMatch(1, "wrongcode", { value: MIN_BET })
      ).to.be.revertedWith("Invalid private code");
    });
  });

  describe("cancelMatch", function () {
    beforeEach(async function () {
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });
    });

    it("should allow creator to cancel", async function () {
      const balanceBefore = await ethers.provider.getBalance(player1.address);

      const tx = await baseRPS.connect(player1).cancelMatch(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(player1.address);
      expect(balanceAfter + gasUsed).to.equal(balanceBefore + MIN_BET);

      const match = await baseRPS.getMatch(1);
      expect(match.state).to.equal(MatchState.Cancelled);
    });

    it("should reject non-creator cancel", async function () {
      await expect(baseRPS.connect(player2).cancelMatch(1)).to.be.revertedWith(
        "Not match creator"
      );
    });
  });

  describe("commitChoice", function () {
    let salt1: string;
    let salt2: string;

    beforeEach(async function () {
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });
      await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });

      salt1 = generateSalt();
      salt2 = generateSalt();
    });

    it("should allow player1 to commit", async function () {
      const commitHash = generateCommitHash(Choice.Rock, salt1);

      await expect(baseRPS.connect(player1).commitChoice(1, commitHash))
        .to.emit(baseRPS, "ChoiceCommitted")
        .withArgs(1, player1.address, 1);
    });

    it("should change state to BothCommitted when both commit", async function () {
      const commit1 = generateCommitHash(Choice.Rock, salt1);
      const commit2 = generateCommitHash(Choice.Paper, salt2);

      await baseRPS.connect(player1).commitChoice(1, commit1);
      await baseRPS.connect(player2).commitChoice(1, commit2);

      const match = await baseRPS.getMatch(1);
      expect(match.state).to.equal(MatchState.BothCommitted);
    });

    it("should reject double commit", async function () {
      const commit = generateCommitHash(Choice.Rock, salt1);
      await baseRPS.connect(player1).commitChoice(1, commit);

      await expect(
        baseRPS.connect(player1).commitChoice(1, commit)
      ).to.be.revertedWith("Already committed");
    });
  });

  describe("revealChoice", function () {
    let salt1: string;
    let salt2: string;

    beforeEach(async function () {
      salt1 = generateSalt();
      salt2 = generateSalt();

      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });
      await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });

      const commit1 = generateCommitHash(Choice.Rock, salt1);
      const commit2 = generateCommitHash(Choice.Paper, salt2);

      await baseRPS.connect(player1).commitChoice(1, commit1);
      await baseRPS.connect(player2).commitChoice(1, commit2);
    });

    it("should allow valid reveal", async function () {
      await expect(baseRPS.connect(player1).revealChoice(1, Choice.Rock, salt1))
        .to.emit(baseRPS, "ChoiceRevealed")
        .withArgs(1, player1.address, Choice.Rock, 1);

      const match = await baseRPS.getMatch(1);
      expect(match.state).to.equal(MatchState.P1Revealed);
    });

    it("should reject invalid reveal (wrong choice)", async function () {
      await expect(
        baseRPS.connect(player1).revealChoice(1, Choice.Paper, salt1)
      ).to.be.revertedWith("Invalid reveal");
    });

    it("should reject invalid reveal (wrong salt)", async function () {
      await expect(
        baseRPS.connect(player1).revealChoice(1, Choice.Rock, generateSalt())
      ).to.be.revertedWith("Invalid reveal");
    });

    it("should complete round when both reveal", async function () {
      await baseRPS.connect(player1).revealChoice(1, Choice.Rock, salt1);
      await baseRPS.connect(player2).revealChoice(1, Choice.Paper, salt2);

      const match = await baseRPS.getMatch(1);
      // Paper beats Rock, player2 wins
      expect(match.state).to.equal(MatchState.Completed);
      expect(match.p2Wins).to.equal(1);
    });
  });

  describe("Full game flow - BO1", function () {
    it("should complete a full game with player1 winning", async function () {
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      // Create and join
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });
      await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });

      // Commit (Rock beats Scissors)
      await baseRPS
        .connect(player1)
        .commitChoice(1, generateCommitHash(Choice.Rock, salt1));
      await baseRPS
        .connect(player2)
        .commitChoice(1, generateCommitHash(Choice.Scissors, salt2));

      // Track balances
      const c1BalanceBefore = await ethers.provider.getBalance(
        commissionWallet1.address
      );

      // Reveal - player1 reveals first
      const p1RevealTx = await baseRPS.connect(player1).revealChoice(1, Choice.Rock, salt1);
      const p1RevealReceipt = await p1RevealTx.wait();
      const p1RevealGas = p1RevealReceipt!.gasUsed * p1RevealReceipt!.gasPrice;

      // Track p1 balance after their reveal (before payout)
      const p1BalanceAfterReveal = await ethers.provider.getBalance(player1.address);

      // Player2 reveals - this triggers the payout to player1
      await baseRPS.connect(player2).revealChoice(1, Choice.Scissors, salt2);

      // Verify winner
      const match = await baseRPS.getMatch(1);
      expect(match.state).to.equal(MatchState.Completed);
      expect(match.p1Wins).to.equal(1);

      // Verify payout
      const totalPot = MIN_BET * 2n;
      const commission = (totalPot * BigInt(COMMISSION_RATE)) / 10000n;
      const winnerPayout = totalPot - commission;

      const p1BalanceAfter = await ethers.provider.getBalance(player1.address);
      // Player1's balance should have increased by the winner payout
      expect(p1BalanceAfter).to.equal(p1BalanceAfterReveal + winnerPayout);

      // Verify commission split
      const c1BalanceAfter = await ethers.provider.getBalance(
        commissionWallet1.address
      );
      const c2BalanceAfter = await ethers.provider.getBalance(
        commissionWallet2.address
      );

      // First wallet gets residue
      expect(c1BalanceAfter).to.be.gt(c1BalanceBefore);

      // Verify stats
      const p1Stats = await baseRPS.getPlayerStats(player1.address);
      expect(p1Stats.wins).to.equal(1);
      expect(p1Stats.totalMatches).to.equal(1);
      expect(p1Stats.rockCount).to.equal(1);

      const p2Stats = await baseRPS.getPlayerStats(player2.address);
      expect(p2Stats.losses).to.equal(1);
      expect(p2Stats.scissorsCount).to.equal(1);
    });
  });

  describe("Full game flow - BO3", function () {
    it("should require 2 wins to complete", async function () {
      // Create and join BO3
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO3, false, ethers.ZeroHash, { value: MIN_BET });
      await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });

      // Round 1: Player 1 wins (Rock beats Scissors)
      let salt1 = generateSalt();
      let salt2 = generateSalt();
      await baseRPS
        .connect(player1)
        .commitChoice(1, generateCommitHash(Choice.Rock, salt1));
      await baseRPS
        .connect(player2)
        .commitChoice(1, generateCommitHash(Choice.Scissors, salt2));
      await baseRPS.connect(player1).revealChoice(1, Choice.Rock, salt1);
      await baseRPS.connect(player2).revealChoice(1, Choice.Scissors, salt2);

      let match = await baseRPS.getMatch(1);
      expect(match.p1Wins).to.equal(1);
      expect(match.currentRound).to.equal(2);
      expect(match.state).to.equal(MatchState.BothJoined);

      // Round 2: Player 1 wins again (Paper beats Rock)
      salt1 = generateSalt();
      salt2 = generateSalt();
      await baseRPS
        .connect(player1)
        .commitChoice(1, generateCommitHash(Choice.Paper, salt1));
      await baseRPS
        .connect(player2)
        .commitChoice(1, generateCommitHash(Choice.Rock, salt2));
      await baseRPS.connect(player1).revealChoice(1, Choice.Paper, salt1);
      await baseRPS.connect(player2).revealChoice(1, Choice.Rock, salt2);

      match = await baseRPS.getMatch(1);
      expect(match.p1Wins).to.equal(2);
      expect(match.state).to.equal(MatchState.Completed);
    });
  });

  describe("Timeout claims", function () {
    it("should allow claiming commit timeout", async function () {
      const salt1 = generateSalt();

      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });
      await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });

      // Only player1 commits
      await baseRPS
        .connect(player1)
        .commitChoice(1, generateCommitHash(Choice.Rock, salt1));

      // Fast forward past commit deadline
      await time.increase(61);

      const balanceBefore = await ethers.provider.getBalance(player1.address);

      const tx = await baseRPS.connect(player1).claimTimeout(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(player1.address);
      expect(balanceAfter + gasUsed).to.equal(balanceBefore + MIN_BET * 2n);

      const match = await baseRPS.getMatch(1);
      expect(match.state).to.equal(MatchState.Expired);
    });

    it("should allow claiming reveal timeout", async function () {
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });
      await baseRPS.connect(player2).joinMatch(1, { value: MIN_BET });

      // Both commit
      await baseRPS
        .connect(player1)
        .commitChoice(1, generateCommitHash(Choice.Rock, salt1));
      await baseRPS
        .connect(player2)
        .commitChoice(1, generateCommitHash(Choice.Paper, salt2));

      // Only player1 reveals
      await baseRPS.connect(player1).revealChoice(1, Choice.Rock, salt1);

      // Fast forward past reveal deadline
      await time.increase(61);

      await baseRPS.connect(player1).claimTimeout(1);

      const match = await baseRPS.getMatch(1);
      expect(match.state).to.equal(MatchState.Expired);
    });

    it("should allow claiming match expiry", async function () {
      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });

      // Fast forward past match expiry
      await time.increase(24 * 60 * 60 + 1);

      const balanceBefore = await ethers.provider.getBalance(player1.address);

      const tx = await baseRPS.connect(player1).claimTimeout(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(player1.address);
      expect(balanceAfter + gasUsed).to.equal(balanceBefore + MIN_BET);

      const match = await baseRPS.getMatch(1);
      expect(match.state).to.equal(MatchState.Expired);
    });
  });

  describe("Admin functions", function () {
    it("should allow owner to update commission rate", async function () {
      await baseRPS.setCommissionRate(500);
      expect(await baseRPS.commissionRate()).to.equal(500);
    });

    it("should reject commission rate above max", async function () {
      await expect(baseRPS.setCommissionRate(1001)).to.be.revertedWith(
        "Rate too high"
      );
    });

    it("should allow owner to update bet limits", async function () {
      const newMin = ethers.parseEther("0.02");
      const newMax = ethers.parseEther("2");
      await baseRPS.setBetLimits(newMin, newMax);
      expect(await baseRPS.minBet()).to.equal(newMin);
      expect(await baseRPS.maxBet()).to.equal(newMax);
    });

    it("should allow owner to pause/unpause", async function () {
      await baseRPS.pause();

      await expect(
        baseRPS
          .connect(player1)
          .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET })
      ).to.be.reverted;

      await baseRPS.unpause();

      await baseRPS
        .connect(player1)
        .createMatch(GameMode.BO1, false, ethers.ZeroHash, { value: MIN_BET });
    });
  });
});
