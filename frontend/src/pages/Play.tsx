import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateMatchForm } from '@/components/match/CreateMatchForm';
import { MatchList } from '@/components/match/MatchCard';
import { QuickMatchModal } from '@/components/match/QuickMatchModal';
import { useOpenMatches, useOpenMatchCount, useJoinMatch } from '@/contracts/hooks/useBaseRPS';
import type { GameMode, MatchState } from '@/config/constants';

type Tab = 'create' | 'join';

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

  // Fetch match details for each open match
  const [matchDetails, setMatchDetails] = useState<Array<{
    matchId: bigint;
    player1: `0x${string}`;
    player2: `0x${string}`;
    betAmount: bigint;
    gameMode: GameMode;
    state: MatchState;
    isPrivate: boolean;
  }>>([]);

  // This is simplified - in production you'd use proper data fetching
  useEffect(() => {
    if (openMatchIds && openMatchIds.length > 0) {
      // For demo purposes, we'll just show the IDs
      // In real implementation, batch fetch match details
      const details = openMatchIds.map((id: bigint) => ({
        matchId: id,
        player1: '0x0000000000000000000000000000000000000001' as `0x${string}`,
        player2: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        betAmount: BigInt(10000000000000000), // 0.01 ETH
        gameMode: 0 as GameMode,
        state: 1 as MatchState,
        isPrivate: false,
      }));
      setMatchDetails(details);
    }
  }, [openMatchIds]);

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

            <MatchList
              matches={matchDetails}
              onJoin={handleJoinMatch}
              onView={handleViewMatch}
              joiningMatchId={joiningMatchId}
              emptyMessage="No open matches. Create one!"
            />

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
