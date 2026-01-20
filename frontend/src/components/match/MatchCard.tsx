import { formatEther } from 'viem';
import { motion } from 'framer-motion';
import { GAME_MODE_NAMES, MATCH_STATE_NAMES, type MatchState, type GameMode } from '@/config/constants';

interface MatchCardProps {
  matchId: bigint;
  player1: `0x${string}`;
  player2: `0x${string}` | null;
  betAmount: bigint;
  gameMode: GameMode;
  state: MatchState;
  isPrivate: boolean;
  onJoin?: () => void;
  onView?: () => void;
  isJoining?: boolean;
}

export function MatchCard({
  matchId,
  player1,
  player2,
  betAmount,
  gameMode,
  state,
  isPrivate,
  onJoin,
  onView,
  isJoining,
}: MatchCardProps) {
  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <motion.div
      className="card hover:border-primary-500 transition-colors cursor-pointer"
      onClick={onView}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-gray-400">Match #{matchId.toString()}</div>
          <div className="text-lg font-bold">{GAME_MODE_NAMES[gameMode]}</div>
        </div>
        <div className="flex items-center gap-2">
          {isPrivate && (
            <span className="px-2 py-1 text-xs bg-purple-900 text-purple-300 rounded">
              Private
            </span>
          )}
          <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
            {MATCH_STATE_NAMES[state]}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-sm text-gray-400">Creator</div>
          <div className="font-mono">{truncateAddress(player1)}</div>
        </div>
        {player2 && (
          <div className="text-right">
            <div className="text-sm text-gray-400">Opponent</div>
            <div className="font-mono">{truncateAddress(player2)}</div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm text-gray-400">Pot</div>
          <div className="text-xl font-bold text-primary-400">
            {formatEther(betAmount * 2n)} ETH
          </div>
        </div>

        {!player2 && onJoin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJoin();
            }}
            disabled={isJoining}
            className="btn btn-primary"
          >
            {isJoining ? 'Joining...' : `Join (${formatEther(betAmount)} ETH)`}
          </button>
        )}
      </div>
    </motion.div>
  );
}

interface MatchListProps {
  matches: Array<{
    matchId: bigint;
    player1: `0x${string}`;
    player2: `0x${string}`;
    betAmount: bigint;
    gameMode: GameMode;
    state: MatchState;
    isPrivate: boolean;
  }>;
  onJoin?: (matchId: bigint, betAmount: bigint) => void;
  onView?: (matchId: bigint) => void;
  joiningMatchId?: bigint;
  emptyMessage?: string;
}

export function MatchList({
  matches,
  onJoin,
  onView,
  joiningMatchId,
  emptyMessage = 'No matches found',
}: MatchListProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => (
        <MatchCard
          key={match.matchId.toString()}
          {...match}
          player2={match.player2 === '0x0000000000000000000000000000000000000000' ? null : match.player2}
          onJoin={onJoin ? () => onJoin(match.matchId, match.betAmount) : undefined}
          onView={onView ? () => onView(match.matchId) : undefined}
          isJoining={joiningMatchId === match.matchId}
        />
      ))}
    </div>
  );
}
