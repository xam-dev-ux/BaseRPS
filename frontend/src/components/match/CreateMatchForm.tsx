import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatEther, parseEther, zeroHash } from 'viem';
import { useCreateMatch, useMinBet, useMaxBet } from '@/contracts/hooks/useBaseRPS';
import { GAME_MODE, GAME_MODE_NAMES, type GameMode } from '@/config/constants';
import { hashPrivateCode } from '@/lib/hash';
import toast from 'react-hot-toast';

interface CreateMatchFormProps {
  onSuccess?: (matchId: bigint) => void;
}

export function CreateMatchForm({ onSuccess: _onSuccess }: CreateMatchFormProps) {
  const [gameMode, setGameMode] = useState<GameMode>(GAME_MODE.BO1);
  const [betAmount, setBetAmount] = useState('0.01');
  const [isPrivate, setIsPrivate] = useState(false);
  const [privateCode, setPrivateCode] = useState('');

  const { data: minBetData } = useMinBet();
  const { data: maxBetData } = useMaxBet();
  const { createMatch, isPending, isConfirming } = useCreateMatch();

  const minBet = minBetData as bigint | undefined;
  const maxBet = maxBetData as bigint | undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const bet = parseEther(betAmount);

      if (minBet && bet < minBet) {
        toast.error(`Minimum bet is ${formatEther(minBet)} ETH`);
        return;
      }

      if (maxBet && bet > maxBet) {
        toast.error(`Maximum bet is ${formatEther(maxBet)} ETH`);
        return;
      }

      const codeHash = isPrivate && privateCode
        ? hashPrivateCode(privateCode)
        : zeroHash;

      await createMatch(bet, gameMode, isPrivate, codeHash);

      toast.success('Match created! Waiting for opponent...');
      // TODO: Get matchId from transaction receipt and call _onSuccess
    } catch (error) {
      console.error('Failed to create match:', error);
      toast.error('Failed to create match');
    }
  };

  const isLoading = isPending || isConfirming;

  return (
    <form onSubmit={handleSubmit} className="card max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-6">Create Match</h2>

      {/* Game Mode */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Game Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(GAME_MODE).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setGameMode(value)}
              className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                gameMode === value
                  ? 'border-primary-500 bg-primary-900/50'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {GAME_MODE_NAMES[value]}
            </button>
          ))}
        </div>
      </div>

      {/* Bet Amount */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Bet Amount (ETH)</label>
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          step="0.001"
          min={minBet ? formatEther(minBet) : '0.001'}
          max={maxBet ? formatEther(maxBet) : '1'}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-primary-500 focus:outline-none"
        />
        <div className="text-xs text-gray-500 mt-1">
          Min: {minBet ? formatEther(minBet) : '0.001'} ETH |
          Max: {maxBet ? formatEther(maxBet) : '1'} ETH
        </div>
      </div>

      {/* Private Match Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-primary-500 focus:ring-primary-500"
          />
          <span>Private Match</span>
        </label>
      </div>

      {/* Private Code */}
      {isPrivate && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <label className="block text-sm text-gray-400 mb-2">
            Private Code (share with opponent)
          </label>
          <input
            type="text"
            value={privateCode}
            onChange={(e) => setPrivateCode(e.target.value)}
            placeholder="Enter a secret code"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-primary-500 focus:outline-none"
          />
        </motion.div>
      )}

      {/* Total Cost */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Your Bet</span>
          <span>{betAmount} ETH</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400 mt-1">
          <span>Potential Pot</span>
          <span>{parseFloat(betAmount) * 2} ETH</span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || (isPrivate && !privateCode)}
        className="w-full btn btn-primary py-3 text-lg"
      >
        {isLoading ? 'Creating...' : `Create Match (${betAmount} ETH)`}
      </button>
    </form>
  );
}
