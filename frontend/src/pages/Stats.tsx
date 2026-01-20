import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { usePlayerStats } from '@/contracts/hooks/useBaseRPS';
import { CHOICE_EMOJIS, CHOICE } from '@/config/constants';

export function Stats() {
  const { address, isConnected } = useAccount();
  const { data: stats, isLoading } = usePlayerStats(address);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Connect Wallet</h1>
        <p className="text-gray-400">
          Connect your wallet to view your stats.
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

  const playerStats = stats as {
    totalMatches: number;
    wins: number;
    losses: number;
    ties: number;
    currentStreak: number;
    bestStreak: number;
    overtimeWins: number;
    overtimeLosses: number;
    rockCount: number;
    paperCount: number;
    scissorsCount: number;
  } | undefined;

  const totalChoices = (playerStats?.rockCount || 0) + (playerStats?.paperCount || 0) + (playerStats?.scissorsCount || 0);
  const winRate = playerStats?.totalMatches
    ? ((playerStats.wins / playerStats.totalMatches) * 100).toFixed(1)
    : '0';

  const getChoicePercentage = (count: number) => {
    if (totalChoices === 0) return 0;
    return (count / totalChoices) * 100;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Stats</h1>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Matches', value: playerStats?.totalMatches || 0 },
          { label: 'Wins', value: playerStats?.wins || 0, color: 'text-green-400' },
          { label: 'Losses', value: playerStats?.losses || 0, color: 'text-red-400' },
          { label: 'Draws', value: playerStats?.ties || 0, color: 'text-gray-400' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            className="card text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={`text-3xl font-bold ${stat.color || ''}`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Win Rate & Streaks */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <motion.div
          className="card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4">Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Win Rate</span>
                <span className="font-semibold">{winRate}%</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Current Streak</span>
              <span className="font-semibold">{playerStats?.currentStreak || 0} wins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Best Streak</span>
              <span className="font-semibold text-yellow-400">
                {playerStats?.bestStreak || 0} wins
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4">Overtime Record</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Overtime Wins</span>
              <span className="font-semibold text-orange-400">
                {playerStats?.overtimeWins || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Overtime Losses</span>
              <span className="font-semibold">{playerStats?.overtimeLosses || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Overtime Win Rate</span>
              <span className="font-semibold">
                {playerStats?.overtimeWins && (playerStats.overtimeWins + playerStats.overtimeLosses) > 0
                  ? ((playerStats.overtimeWins / (playerStats.overtimeWins + playerStats.overtimeLosses)) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Choice Distribution */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4">Choice Distribution</h3>
        <div className="space-y-4">
          {[
            { choice: CHOICE.Rock, count: playerStats?.rockCount || 0, label: 'Rock' },
            { choice: CHOICE.Paper, count: playerStats?.paperCount || 0, label: 'Paper' },
            { choice: CHOICE.Scissors, count: playerStats?.scissorsCount || 0, label: 'Scissors' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <span>{CHOICE_EMOJIS[item.choice]}</span>
                  <span>{item.label}</span>
                </span>
                <span>
                  {item.count} ({getChoicePercentage(item.count).toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getChoicePercentage(item.count)}%` }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </div>
            </div>
          ))}
        </div>

        {totalChoices > 10 && (
          <div className="mt-6 p-4 bg-gray-900 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Play Style Analysis</h4>
            <p className="text-sm text-gray-400">
              {(() => {
                const rock = playerStats?.rockCount || 0;
                const paper = playerStats?.paperCount || 0;
                const scissors = playerStats?.scissorsCount || 0;
                const max = Math.max(rock, paper, scissors);

                if (max === rock) {
                  return "You favor Rock - a solid, defensive choice. Watch out for Paper players!";
                } else if (max === paper) {
                  return "You lean towards Paper - an aggressive counter-player. Beware of Scissors!";
                } else {
                  return "You prefer Scissors - quick and decisive. Rock might catch you off guard!";
                }
              })()}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
