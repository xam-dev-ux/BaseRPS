import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEther, parseEther } from 'viem';
import { useCreateMatch, useJoinMatch, useOpenMatches, useMinBet, useMaxBet } from '@/contracts/hooks/useBaseRPS';
import { GAME_MODE, GAME_MODE_NAMES, type GameMode } from '@/config/constants';

interface QuickMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchFound: (matchId: bigint) => void;
}

export function QuickMatchModal({ isOpen, onClose, onMatchFound }: QuickMatchModalProps) {
  const [betAmount, setBetAmount] = useState('');
  const [gameMode, setGameMode] = useState<GameMode>(GAME_MODE.BO1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');

  const { data: minBetData } = useMinBet();
  const { data: maxBetData } = useMaxBet();
  const { data: openMatchIdsData } = useOpenMatches(0n, 50n);

  const { createMatch, isPending: isCreating } = useCreateMatch();
  const { joinMatch, isPending: isJoining } = useJoinMatch();

  const minBet = minBetData as bigint | undefined;
  const maxBet = maxBetData as bigint | undefined;
  const openMatchIds = openMatchIdsData as bigint[] | undefined;

  const handleQuickMatch = async () => {
    try {
      setIsSearching(true);
      const bet = parseEther(betAmount);

      // Look for existing match with similar bet
      setSearchStatus('Searching for opponents...');

      // In production, this would filter by bet amount and game mode
      // For now, just try to join any open match or create one
      if (openMatchIds && openMatchIds.length > 0) {
        // Try to join the first available match
        // In production, filter by bet tolerance (within 10% of desired bet)
        setSearchStatus('Found a match! Joining...');
        await joinMatch(openMatchIds[0], bet);
        onMatchFound(openMatchIds[0]);
      } else {
        // No matches found, create one
        setSearchStatus('No matches found. Creating one...');
        await createMatch(bet, gameMode, false);
        // Note: We need to watch for MatchCreated event to get the matchId
        // For now, just close the modal - user will be navigated via isSuccess
        onClose();
      }
    } catch (error) {
      console.error('Quick match failed:', error);
      setSearchStatus('Failed to find match. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const betPresets = ['0.0001', '0.001', '0.01', '0.1'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50"
            initial={{ opacity: 0, scale: 0.9, y: '-40%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: '-40%' }}
          >
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Quick Match</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isSearching ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-lg font-semibold">{searchStatus}</p>
                  <p className="text-gray-400 mt-2">This may take a moment...</p>
                </div>
              ) : (
                <>
                  {/* Bet Amount */}
                  <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2">Bet Amount</label>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {betPresets.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setBetAmount(preset)}
                          className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                            betAmount === preset
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {preset} ETH
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="Enter bet amount"
                      step="0.00001"
                      min={minBet ? formatEther(minBet) : '0.00001'}
                      max={maxBet ? formatEther(maxBet) : '1'}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-primary-500 focus:outline-none"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Min: {minBet ? formatEther(minBet) : '0.00001'} ETH</span>
                      <span>Max: {maxBet ? formatEther(maxBet) : '1'} ETH</span>
                    </div>
                  </div>

                  {/* Game Mode */}
                  <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2">Game Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(GAME_MODE_NAMES).map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => setGameMode(Number(value) as GameMode)}
                          className={`py-3 rounded-lg font-medium transition-colors ${
                            gameMode === Number(value)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Match Count */}
                  <div className="mb-6 p-3 bg-gray-900 rounded-lg text-center">
                    <span className="text-gray-400">
                      {openMatchIds?.length || 0} matches available
                    </span>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleQuickMatch}
                    disabled={isCreating || isJoining || !betAmount}
                    className="w-full btn btn-primary py-4 text-lg font-bold"
                  >
                    {isCreating || isJoining ? (
                      'Searching...'
                    ) : (
                      <>
                        <span className="mr-2">⚡</span>
                        Find Match
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    We'll find an existing match or create one for you automatically.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
