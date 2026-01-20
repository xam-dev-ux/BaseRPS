import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { useActiveMatches, useMatch } from '@/contracts/hooks/useBaseRPS';
import { MATCH_STATE, MATCH_STATE_NAMES, GAME_MODE_NAMES, type MatchState, type GameMode } from '@/config/constants';
import { formatEther } from 'viem';

// Component to display a single match with real data
function MatchCard({
  matchId,
  onClick,
  getStateColor,
}: {
  matchId: bigint;
  onClick: () => void;
  getStateColor: (state: MatchState) => string;
}) {
  const { data: matchData, isLoading } = useMatch(matchId);

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-24 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!matchData) return null;

  const match = matchData as {
    player1: `0x${string}`;
    player2: `0x${string}`;
    betAmount: bigint;
    gameMode: number;
    state: number;
    p1Wins: number;
    p2Wins: number;
  };

  return (
    <motion.div
      className="card hover:border-primary-500 cursor-pointer transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-gray-400">
            Match #{matchId.toString()}
          </div>
          <div className="font-semibold">
            {GAME_MODE_NAMES[match.gameMode as GameMode]}
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${getStateColor(match.state as MatchState)}`}>
          {MATCH_STATE_NAMES[match.state as MatchState]}
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
  );
}

export function MyBattles() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { data: activeMatchIdsData, isLoading, refetch } = useActiveMatches(address);

  const activeMatchIds = activeMatchIdsData as bigint[] | undefined;

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Battles</h1>
        <button onClick={() => refetch()} className="btn btn-secondary">
          Refresh
        </button>
      </div>

      {/* All Matches */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          My Matches ({activeMatchIds?.length || 0})
        </h2>

        {!activeMatchIds || activeMatchIds.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            No matches found. <a href="/play" className="text-primary-400 hover:underline">Start a new one!</a>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeMatchIds.map((matchId) => (
              <MatchCard
                key={matchId.toString()}
                matchId={matchId}
                onClick={() => navigate(`/match/${matchId}`)}
                getStateColor={getStateColor}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
