import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateMatchForm } from '@/components/match/CreateMatchForm';
import { QuickMatchModal } from '@/components/match/QuickMatchModal';
import { useOpenMatches, useOpenMatchCount, useJoinMatch, useMatch } from '@/contracts/hooks/useBaseRPS';
import { GAME_MODE_NAMES, MATCH_STATE_NAMES, type GameMode, type MatchState } from '@/config/constants';

type Tab = 'create' | 'join';

// Component to display a single open match with real data
function OpenMatchCard({
  matchId,
  onJoin,
  onView,
  isJoining,
}: {
  matchId: bigint;
  onJoin: (matchId: bigint, betAmount: bigint) => void;
  onView: (matchId: bigint) => void;
  isJoining: boolean;
}) {
  const { data: matchData, isLoading } = useMatch(matchId);

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-20 bg-gray-700 rounded"></div>
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
    isPrivate: boolean;
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <motion.div
      className="card hover:border-primary-500 transition-colors cursor-pointer"
      onClick={() => onView(matchId)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-gray-400">Match #{matchId.toString()}</div>
          <div className="text-lg font-bold">{GAME_MODE_NAMES[match.gameMode as GameMode]}</div>
        </div>
        <div className="flex items-center gap-2">
          {match.isPrivate && (
            <span className="px-2 py-1 text-xs bg-purple-900 text-purple-300 rounded">
              Private
            </span>
          )}
          <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
            {MATCH_STATE_NAMES[match.state as MatchState]}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-sm text-gray-400">Creator</div>
          <div className="font-mono">{truncateAddress(match.player1)}</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm text-gray-400">Pot</div>
          <div className="text-xl font-bold text-primary-400">
            {formatEther(match.betAmount * 2n)} ETH
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onJoin(matchId, match.betAmount);
          }}
          disabled={isJoining}
          className="btn btn-primary"
        >
          {isJoining ? 'Joining...' : `Join (${formatEther(match.betAmount)} ETH)`}
        </button>
      </div>
    </motion.div>
  );
}

export function Play() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>('join');
  const [joiningMatchId, setJoiningMatchId] = useState<bigint | undefined>();
  const [showQuickMatch, setShowQuickMatch] = useState(false);

  const { data: openMatchCountData } = useOpenMatchCount();
  const { data: openMatchIdsData, refetch: refetchOpenMatches } = useOpenMatches(0n, 20n);

  const openMatchCount = openMatchCountData as bigint | undefined;
  const openMatchIds = openMatchIdsData as bigint[] | undefined;

  const { joinMatch, isSuccess: joinSuccess } = useJoinMatch();

  // Navigate to match after successful join
  useEffect(() => {
    if (joinSuccess && joiningMatchId) {
      navigate(`/match/${joiningMatchId}`);
    }
  }, [joinSuccess, joiningMatchId, navigate]);

  const handleJoinMatch = async (matchId: bigint, betAmount: bigint) => {
    setJoiningMatchId(matchId);
    try {
      await joinMatch(matchId, betAmount);
    } catch (error) {
      console.error('Failed to join match:', error);
      setJoiningMatchId(undefined);
    }
  };

  const handleViewMatch = (matchId: bigint) => {
    navigate(`/match/${matchId}`);
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Connect Wallet to Play</h1>
        <p className="text-gray-400">
          Connect your wallet to create or join matches.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Play BaseRPS</h1>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('join')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'join'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Join Match ({openMatchCount?.toString() || 0})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'create'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Create Match
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'join' ? (
          <motion.div
            key="join"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Open Matches</h2>
              <button
                onClick={() => refetchOpenMatches()}
                className="btn btn-secondary text-sm"
              >
                Refresh
              </button>
            </div>

            {openMatchIds && openMatchIds.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {openMatchIds.map((matchId) => (
                  <OpenMatchCard
                    key={matchId.toString()}
                    matchId={matchId}
                    onJoin={handleJoinMatch}
                    onView={handleViewMatch}
                    isJoining={joiningMatchId === matchId}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                No open matches. Create one!
              </div>
            )}

            {/* Join by ID */}
            <div className="mt-8 card">
              <h3 className="font-semibold mb-4">Join Private Match</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const matchId = formData.get('matchId') as string;
                  if (matchId) {
                    handleViewMatch(BigInt(matchId));
                  }
                }}
                className="flex gap-4"
              >
                <input
                  name="matchId"
                  type="number"
                  placeholder="Enter Match ID"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-primary-500 focus:outline-none"
                />
                <button type="submit" className="btn btn-primary">
                  Go to Match
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <CreateMatchForm
              onSuccess={(matchId) => navigate(`/match/${matchId}`)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Match Floating Button */}
      <motion.button
        onClick={() => setShowQuickMatch(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full shadow-lg shadow-primary-500/30 flex items-center justify-center text-2xl hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        ⚡
      </motion.button>

      {/* Quick Match Modal */}
      <QuickMatchModal
        isOpen={showQuickMatch}
        onClose={() => setShowQuickMatch(false)}
        onMatchFound={(matchId) => {
          setShowQuickMatch(false);
          navigate(`/match/${matchId}`);
        }}
      />
    </div>
  );
}
