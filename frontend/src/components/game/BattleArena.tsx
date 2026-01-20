import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEther } from 'viem';
import { ChoiceSelector, ChoiceDisplay } from './ChoiceSelector';
import { ScoreDisplay, RoundIndicator } from './ScoreDisplay';
import { OvertimeIndicator, OvertimeBanner } from './OvertimeIndicator';
import { Timer } from '../common/Timer';
import { useMatchInfo, useRoundInfo, useMatchPhase } from '@/contracts/hooks/useMatch';
import { useCommitReveal } from '@/hooks/useCommitReveal';
import { useContractEvents } from '@/hooks/useContractEvents';
import { useOvertimeUI, getOvertimeBackgroundClass } from '@/hooks/useOvertimeUI';
import { WINS_REQUIRED, type Choice, type GameMode } from '@/config/constants';

interface BattleArenaProps {
  matchId: bigint;
  onMatchEnd?: () => void;
}

export function BattleArena({ matchId, onMatchEnd }: BattleArenaProps) {
  const { address } = useAccount();
  const { matchInfo, refetch: refetchMatch } = useMatchInfo(matchId);
  const { roundInfo, refetch: refetchRound } = useRoundInfo(
    matchId,
    matchInfo?.currentRound ?? 1
  );

  const phase = useMatchPhase(matchInfo, roundInfo);
  const { commit, reveal, canReveal, getStoredChoice, isCommitting, isRevealing } =
    useCommitReveal({ matchId, currentRound: matchInfo?.currentRound ?? 1 });

  const tieCount = roundInfo?.tieCount ?? 0;
  const overtimeUI = useOvertimeUI(tieCount);

  // Calculate opponent wallet for push notifications
  const opponentWallet = matchInfo
    ? matchInfo.isPlayer1
      ? matchInfo.player2
      : matchInfo.player1
    : undefined;

  // Set up event listeners
  useContractEvents({
    matchId,
    opponentWallet: opponentWallet as `0x${string}` | undefined,
    onMatchJoined: () => refetchMatch(),
    onOpponentCommitted: () => refetchRound(),
    onOpponentRevealed: () => refetchRound(),
    onRoundResult: () => {
      refetchMatch();
      refetchRound();
    },
    onMatchCompleted: () => {
      refetchMatch();
      onMatchEnd?.();
    },
  });

  // Auto-refetch on phase change
  useEffect(() => {
    const interval = setInterval(() => {
      refetchMatch();
      refetchRound();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetchMatch, refetchRound]);

  if (!matchInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const storedChoice = getStoredChoice();

  const handleChoiceSelect = async (choice: Choice) => {
    await commit(choice);
  };

  const handleReveal = async () => {
    if (canReveal()) {
      await reveal();
    }
  };

  return (
    <div className={`min-h-screen ${getOvertimeBackgroundClass(tieCount)} transition-colors duration-500`}>
      {/* Overtime Banner */}
      <AnimatePresence>
        {overtimeUI.isOvertime && <OvertimeBanner tieCount={tieCount} />}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Match Info */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm text-gray-400">Match #{matchId.toString()}</div>
              <div className="text-lg font-bold">
                {WINS_REQUIRED[matchInfo.gameMode as keyof typeof WINS_REQUIRED]} wins to victory
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Total Pot</div>
              <div className="text-xl font-bold text-primary-400">
                {formatEther(matchInfo.totalPot)} ETH
              </div>
            </div>
          </div>

          <RoundIndicator
            currentRound={matchInfo.currentRound}
            maxRounds={WINS_REQUIRED[matchInfo.gameMode as keyof typeof WINS_REQUIRED] * 2 - 1}
          />
        </div>

        {/* Score Display */}
        <ScoreDisplay
          p1Wins={matchInfo.p1Wins}
          p2Wins={matchInfo.p2Wins}
          gameMode={matchInfo.gameMode as GameMode}
          player1Address={matchInfo.player1}
          player2Address={matchInfo.player2}
          currentUserAddress={address}
          className="mb-8"
        />

        {/* Overtime Indicator */}
        <AnimatePresence>
          {overtimeUI.isOvertime && (
            <OvertimeIndicator tieCount={tieCount} className="mb-6" />
          )}
        </AnimatePresence>

        {/* Game Phase Content */}
        <div className="card">
          {/* Commit Phase */}
          {phase === 'commit' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h3 className="text-xl font-bold mb-4">Choose Your Move!</h3>

              {roundInfo?.commitDeadline && (
                <Timer
                  deadline={roundInfo.commitDeadline}
                  className="mb-6"
                  warningThreshold={15}
                />
              )}

              <ChoiceSelector
                onSelect={handleChoiceSelect}
                selectedChoice={storedChoice}
                disabled={isCommitting}
                size="lg"
              />

              {isCommitting && (
                <div className="mt-4 text-gray-400">Committing choice...</div>
              )}
            </motion.div>
          )}

          {/* Waiting for Opponent Commit */}
          {phase === 'waiting-opponent-commit' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <h3 className="text-xl font-bold mb-4">Waiting for Opponent</h3>

              {roundInfo?.commitDeadline && (
                <Timer deadline={roundInfo.commitDeadline} className="mb-6" />
              )}

              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">You</div>
                  <ChoiceDisplay choice={storedChoice} revealed={false} />
                  <div className="text-green-400 text-sm mt-2">Committed</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Opponent</div>
                  <ChoiceDisplay choice={null} revealed={false} />
                  <div className="text-gray-400 text-sm mt-2">Waiting...</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Reveal Phase */}
          {phase === 'reveal' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h3 className="text-xl font-bold mb-4">Reveal Your Choice!</h3>

              {roundInfo?.revealDeadline && (
                <Timer
                  deadline={roundInfo.revealDeadline}
                  className="mb-6"
                  warningThreshold={15}
                />
              )}

              <div className="flex justify-center mb-6">
                <ChoiceDisplay choice={storedChoice} revealed={true} size="lg" />
              </div>

              <button
                onClick={handleReveal}
                disabled={isRevealing || !canReveal()}
                className="btn btn-primary py-3 px-8 text-lg"
              >
                {isRevealing ? 'Revealing...' : 'Reveal Choice'}
              </button>

              {!canReveal() && (
                <div className="mt-4 text-red-400">
                  Cannot reveal - salt not found!
                </div>
              )}
            </motion.div>
          )}

          {/* Waiting for Opponent Reveal */}
          {phase === 'waiting-opponent-reveal' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <h3 className="text-xl font-bold mb-4">Waiting for Opponent to Reveal</h3>

              {roundInfo?.revealDeadline && (
                <Timer deadline={roundInfo.revealDeadline} className="mb-6" />
              )}

              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">You</div>
                  <ChoiceDisplay choice={storedChoice} revealed={true} />
                  <div className="text-green-400 text-sm mt-2">Revealed</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Opponent</div>
                  <ChoiceDisplay choice={null} revealed={false} />
                  <div className="text-gray-400 text-sm mt-2">Revealing...</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Match Completed */}
          {phase === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <h3 className="text-2xl font-bold mb-4">
                {matchInfo.p1Wins > matchInfo.p2Wins
                  ? matchInfo.isPlayer1
                    ? 'Victory!'
                    : 'Defeat'
                  : matchInfo.isPlayer2
                  ? 'Victory!'
                  : 'Defeat'}
              </h3>

              <div className="text-gray-400">
                Final Score: {matchInfo.p1Wins} - {matchInfo.p2Wins}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
