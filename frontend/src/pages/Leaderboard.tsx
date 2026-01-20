import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';

type TimeRange = 'all' | 'weekly' | 'daily';
type Category = 'wins' | 'streak' | 'overtime';

// Mock leaderboard data - in production, this would come from an indexer/subgraph
const MOCK_LEADERBOARD = {
  wins: [
    { address: '0x1234...5678', wins: 152, losses: 48, winRate: 76, totalWagered: '12.5' },
    { address: '0xabcd...ef01', wins: 134, losses: 66, winRate: 67, totalWagered: '8.2' },
    { address: '0x9876...4321', wins: 98, losses: 52, winRate: 65, totalWagered: '15.1' },
    { address: '0xfedc...ba98', wins: 87, losses: 43, winRate: 67, totalWagered: '6.8' },
    { address: '0x5555...6666', wins: 76, losses: 44, winRate: 63, totalWagered: '9.4' },
  ],
  streak: [
    { address: '0x1234...5678', currentStreak: 12, bestStreak: 18, wins: 152 },
    { address: '0x7777...8888', currentStreak: 9, bestStreak: 15, wins: 67 },
    { address: '0xabcd...ef01', currentStreak: 7, bestStreak: 12, wins: 134 },
    { address: '0x9999...aaaa', currentStreak: 6, bestStreak: 11, wins: 45 },
    { address: '0xbbbb...cccc', currentStreak: 5, bestStreak: 9, wins: 89 },
  ],
  overtime: [
    { address: '0xdead...beef', overtimeWins: 23, overtimeLosses: 5, longestTieStreak: 8 },
    { address: '0x1234...5678', overtimeWins: 18, overtimeLosses: 7, longestTieStreak: 6 },
    { address: '0xcafe...babe', overtimeWins: 15, overtimeLosses: 3, longestTieStreak: 7 },
    { address: '0xfeed...face', overtimeWins: 12, overtimeLosses: 8, longestTieStreak: 5 },
    { address: '0xabcd...ef01', overtimeWins: 11, overtimeLosses: 4, longestTieStreak: 4 },
  ],
};

const MEDALS = ['🥇', '🥈', '🥉'];

export function Leaderboard() {
  const { address } = useAccount();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [category, setCategory] = useState<Category>('wins');

  const timeRanges: { value: TimeRange; label: string; icon: string }[] = [
    { value: 'all', label: 'All Time', icon: '🏆' },
    { value: 'weekly', label: 'This Week', icon: '📅' },
    { value: 'daily', label: 'Today', icon: '🔥' },
  ];

  const categories: { value: Category; label: string; description: string }[] = [
    { value: 'wins', label: 'Top Winners', description: 'Most victories' },
    { value: 'streak', label: 'Win Streaks', description: 'Longest streaks' },
    { value: 'overtime', label: 'Overtime Legends', description: 'Clutch players' },
  ];

  const data = MOCK_LEADERBOARD[category];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-center">Leaderboard</h1>
      <p className="text-gray-400 text-center mb-8">
        The best Rock Paper Scissors players on Base
      </p>

      {/* Time Range Tabs */}
      <div className="flex justify-center gap-2 mb-6">
        {timeRanges.map((range) => (
          <button
            key={range.value}
            onClick={() => setTimeRange(range.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === range.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span className="mr-1">{range.icon}</span>
            {range.label}
          </button>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`p-4 rounded-lg text-center transition-all ${
              category === cat.value
                ? 'bg-primary-900 border-2 border-primary-500'
                : 'bg-gray-800 border-2 border-transparent hover:border-gray-600'
            }`}
          >
            <div className="font-bold">{cat.label}</div>
            <div className="text-sm text-gray-400">{cat.description}</div>
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {category === 'wins' && (
          <>
            {(data as typeof MOCK_LEADERBOARD.wins).map((player, index) => (
              <motion.div
                key={player.address}
                className={`card flex items-center gap-4 ${
                  index < 3 ? 'border-primary-500/50' : ''
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="w-12 text-center">
                  {index < 3 ? (
                    <span className="text-2xl">{MEDALS[index]}</span>
                  ) : (
                    <span className="text-gray-500 font-bold">{index + 1}</span>
                  )}
                </div>

                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xl font-bold">
                  {player.address.slice(2, 4).toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="font-semibold">{player.address}</div>
                  <div className="text-sm text-gray-400">
                    {player.totalWagered} ETH wagered
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-green-400">{player.wins} wins</div>
                  <div className="text-sm text-gray-400">
                    {player.winRate}% win rate
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}

        {category === 'streak' && (
          <>
            {(data as typeof MOCK_LEADERBOARD.streak).map((player, index) => (
              <motion.div
                key={player.address}
                className={`card flex items-center gap-4 ${
                  player.currentStreak >= 5 ? 'border-orange-500/50' : ''
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="w-12 text-center">
                  {index < 3 ? (
                    <span className="text-2xl">{MEDALS[index]}</span>
                  ) : (
                    <span className="text-gray-500 font-bold">{index + 1}</span>
                  )}
                </div>

                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xl font-bold">
                  {player.address.slice(2, 4).toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    {player.address}
                    {player.currentStreak >= 5 && (
                      <span className="text-xs bg-orange-600 px-2 py-0.5 rounded">
                        ON FIRE
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {player.wins} total wins
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-orange-400">
                    {player.currentStreak} streak
                  </div>
                  <div className="text-sm text-gray-400">
                    Best: {player.bestStreak}
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}

        {category === 'overtime' && (
          <>
            {(data as typeof MOCK_LEADERBOARD.overtime).map((player, index) => (
              <motion.div
                key={player.address}
                className={`card flex items-center gap-4 ${
                  index < 3 ? 'border-red-500/50' : ''
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="w-12 text-center">
                  {index < 3 ? (
                    <span className="text-2xl">{MEDALS[index]}</span>
                  ) : (
                    <span className="text-gray-500 font-bold">{index + 1}</span>
                  )}
                </div>

                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                  <span className="text-xl">🔥</span>
                </div>

                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    {player.address}
                    <span className="text-xs bg-red-600 px-2 py-0.5 rounded">
                      CLUTCH
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Survived {player.longestTieStreak} ties in a row
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-red-400">
                    {player.overtimeWins} OT wins
                  </div>
                  <div className="text-sm text-gray-400">
                    {Math.round(
                      (player.overtimeWins /
                        (player.overtimeWins + player.overtimeLosses)) *
                        100
                    )}
                    % OT rate
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Your Ranking */}
      {address && (
        <motion.div
          className="mt-8 card bg-primary-900/30 border-primary-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xl font-bold">
                {address.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">Your Ranking</div>
                <div className="text-sm text-gray-400">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400">Rank</div>
              <div className="text-2xl font-bold">#42</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Coming Soon Note */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Leaderboard data is updated in real-time from onchain events.
        </p>
        <p className="mt-1">
          Connect your wallet to see your ranking!
        </p>
      </div>
    </div>
  );
}
