import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { useActiveMatches } from '@/contracts/hooks/useBaseRPS';
import { MATCH_STATE, MATCH_STATE_NAMES, GAME_MODE_NAMES, type MatchState, type GameMode } from '@/config/constants';
import { formatEther } from 'viem';

interface MatchDetails {
  matchId: bigint;
  player1: `0x${string}`;
  player2: `0x${string}`;
  betAmount: bigint;
  gameMode: GameMode;
  state: MatchState;
  p1Wins: number;
  p2Wins: number;
}

export function MyBattles() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { data: activeMatchIdsData, isLoading, refetch } = useActiveMatches(address);
  const [matchDetails, setMatchDetails] = useState<MatchDetails[]>([]);

  const activeMatchIds = activeMatchIdsData as bigint[] | undefined;

  // For demo purposes - in production, batch fetch match details
  useEffect(() => {
    if (activeMatchIds && activeMatchIds.length > 0) {
      // Simplified - would need actual contract calls in production
      const details: MatchDetails[] = activeMatchIds.map((id: bigint) => ({
        matchId: id,
        player1: address!,
        player2: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        betAmount: BigInt(10000000000000000),
        gameMode: 0 as GameMode,
        state: 1 as MatchState,
        p1Wins: 0,
        p2Wins: 0,
      }));
      setMatchDetails(details);
    } else {
      setMatchDetails([]);
    }
  }, [activeMatchIds, address]);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Connect Wallet</h1>
        <p className="text-gray-400">
          Connect your wallet to view your battles.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStateColor = (state: MatchState) => {
    switch (state) {
      case MATCH_STATE.WaitingForP2:
        return 'bg-yellow-900 text-yellow-300';
      case MATCH_STATE.BothJoined:
      case MATCH_STATE.BothCommitted:
      case MATCH_STATE.P1Revealed:
      case MATCH_STATE.P2Revealed:
        return 'bg-green-900 text-green-300';
      case MATCH_STATE.Completed:
        return 'bg-gray-700 text-gray-300';
      case MATCH_STATE.Expired:
      case MATCH_STATE.Cancelled:
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const isActiveState = (state: MatchState): boolean => {
    const activeStates: MatchState[] = [
      MATCH_STATE.WaitingForP2,
      MATCH_STATE.BothJoined,
      MATCH_STATE.BothCommitted,
      MATCH_STATE.P1Revealed,
      MATCH_STATE.P2Revealed,
    ];
    return activeStates.includes(state);
  };

  const activeMatches = matchDetails.filter((m) => isActiveState(m.state));
  const completedMatches = matchDetails.filter((m) => !isActiveState(m.state));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Battles</h1>
        <button onClick={() => refetch()} className="btn btn-secondary">
          Refresh
        </button>
      </div>

      {/* Active Matches */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          Active Matches ({activeMatches.length})
        </h2>

        {activeMatches.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            No active matches. <a href="/play" className="text-primary-400 hover:underline">Start a new one!</a>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeMatches.map((match) => (
              <motion.div
                key={match.matchId.toString()}
                className="card hover:border-primary-500 cursor-pointer transition-colors"
                onClick={() => navigate(`/match/${match.matchId}`)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm text-gray-400">
                      Match #{match.matchId.toString()}
                    </div>
                    <div className="font-semibold">
                      {GAME_MODE_NAMES[match.gameMode]}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${getStateColor(match.state)}`}>
                    {MATCH_STATE_NAMES[match.state]}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-400">Pot</div>
                    <div className="font-bold text-primary-400">
                      {formatEther(match.betAmount * 2n)} ETH
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Score</div>
                    <div className="font-bold">
                      {match.p1Wins} - {match.p2Wins}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Matches */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Past Matches ({completedMatches.length})
        </h2>

        {completedMatches.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            No completed matches yet.
          </div>
        ) : (
          <div className="space-y-3">
            {completedMatches.map((match) => (
              <motion.div
                key={match.matchId.toString()}
                className="card flex items-center justify-between hover:border-gray-600 cursor-pointer transition-colors"
                onClick={() => navigate(`/match/${match.matchId}`)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-400">
                    #{match.matchId.toString()}
                  </div>
                  <div>{GAME_MODE_NAMES[match.gameMode]}</div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-sm">
                    {match.p1Wins} - {match.p2Wins}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${getStateColor(match.state)}`}>
                    {match.state === MATCH_STATE.Completed
                      ? match.p1Wins > match.p2Wins
                        ? 'Won'
                        : match.p2Wins > match.p1Wins
                        ? 'Lost'
                        : 'Draw'
                      : MATCH_STATE_NAMES[match.state]}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
