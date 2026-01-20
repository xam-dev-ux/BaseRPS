import { motion } from 'framer-motion';
import { WINS_REQUIRED, type GameMode } from '@/config/constants';

interface ScoreDisplayProps {
  p1Wins: number;
  p2Wins: number;
  gameMode: GameMode;
  player1Address: string;
  player2Address: string;
  currentUserAddress?: string;
  className?: string;
}

export function ScoreDisplay({
  p1Wins,
  p2Wins,
  gameMode,
  player1Address,
  player2Address,
  currentUserAddress,
  className = '',
}: ScoreDisplayProps) {
  const winsRequired = WINS_REQUIRED[gameMode];
  const isPlayer1 = currentUserAddress?.toLowerCase() === player1Address.toLowerCase();
  const isPlayer2 = currentUserAddress?.toLowerCase() === player2Address.toLowerCase();

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className={`flex items-center justify-center gap-8 ${className}`}>
      {/* Player 1 */}
      <div className={`text-center ${isPlayer1 ? 'text-primary-400' : ''}`}>
        <div className="text-sm text-gray-400 mb-1">
          {isPlayer1 ? 'You' : truncate(player1Address)}
        </div>
        <motion.div
          className="text-4xl font-bold"
          key={p1Wins}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {p1Wins}
        </motion.div>
        <div className="flex gap-1 justify-center mt-2">
          {Array.from({ length: winsRequired }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < p1Wins ? 'bg-green-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* VS */}
      <div className="text-2xl font-bold text-gray-500">VS</div>

      {/* Player 2 */}
      <div className={`text-center ${isPlayer2 ? 'text-primary-400' : ''}`}>
        <div className="text-sm text-gray-400 mb-1">
          {isPlayer2 ? 'You' : truncate(player2Address)}
        </div>
        <motion.div
          className="text-4xl font-bold"
          key={p2Wins}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {p2Wins}
        </motion.div>
        <div className="flex gap-1 justify-center mt-2">
          {Array.from({ length: winsRequired }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < p2Wins ? 'bg-green-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface RoundIndicatorProps {
  currentRound: number;
  maxRounds: number;
  className?: string;
}

export function RoundIndicator({ currentRound, maxRounds, className = '' }: RoundIndicatorProps) {
  return (
    <div className={`text-center ${className}`}>
      <div className="text-sm text-gray-400 uppercase tracking-wider">Round</div>
      <div className="text-2xl font-bold">
        {currentRound} / {maxRounds}
      </div>
    </div>
  );
}
