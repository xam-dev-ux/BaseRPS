import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { motion } from 'framer-motion';
import { BattleArena } from '@/components/game/BattleArena';
import { Timer } from '@/components/common/Timer';
import { useMatchInfo } from '@/contracts/hooks/useMatch';
import { useJoinMatch, useJoinPrivateMatch, useCancelMatch, useCreateMatch } from '@/contracts/hooks/useBaseRPS';
import { MATCH_STATE, GAME_MODE_NAMES, type GameMode } from '@/config/constants';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export function Match() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const [privateCode, setPrivateCode] = useState('');

  const parsedMatchId = matchId ? BigInt(matchId) : undefined;
  const { matchInfo, isLoading, error } = useMatchInfo(parsedMatchId);

  // Debug logging
  console.log('[Match] matchId:', matchId);
  console.log('[Match] address:', address);
  console.log('[Match] isLoading:', isLoading);
  console.log('[Match] error:', error);
  console.log('[Match] matchInfo:', matchInfo ? {
    state: matchInfo.state,
    player1: matchInfo.player1,
    player2: matchInfo.player2,
    isPlayer1: matchInfo.isPlayer1,
    isPlayer2: matchInfo.isPlayer2,
    betAmount: matchInfo.betAmount?.toString(),
    currentRound: matchInfo.currentRound,
    p1Wins: matchInfo.p1Wins,
    p2Wins: matchInfo.p2Wins,
  } : null);

  const { joinMatch, isPending: isJoining } = useJoinMatch();
  const { joinPrivateMatch, isPending: isJoiningPrivate } = useJoinPrivateMatch();
  const { cancelMatch, isPending: isCancelling, isSuccess: isCancelSuccess, hash: cancelHash } = useCancelMatch();
  const { createMatch, isPending: isCreatingRematch } = useCreateMatch();

  const processedCancelHash = useRef<string | null>(null);

  // Redirect after successful cancel
  useEffect(() => {
    if (isCancelSuccess && cancelHash && cancelHash !== processedCancelHash.current) {
      processedCancelHash.current = cancelHash;
      toast.success('Match cancelled successfully');
      navigate('/play');
    }
  }, [isCancelSuccess, cancelHash, navigate]);

  const handleRematch = async () => {
    if (!matchInfo) return;
    try {
      await createMatch(matchInfo.betAmount, matchInfo.gameMode as GameMode, false);
      toast.success('Rematch created! Go to My Battles to see it.');
      navigate('/my-battles');
    } catch (error) {
      console.error('Failed to create rematch:', error);
      toast.error('Failed to create rematch');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `I just ${matchInfo?.isPlayer1 && matchInfo?.p1Wins > matchInfo?.p2Wins ? 'won' : 'played'} a Rock Paper Scissors battle on BaseRPS! Challenge me: `;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'BaseRPS Battle', text, url });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (!matchId) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Match Not Found</h1>
        <Link to="/play" className="btn btn-primary">
          Back to Play
        </Link>
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

  if (error || !matchInfo) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Error Loading Match</h1>
        <p className="text-gray-400 mb-8">Could not load match #{matchId}</p>
        <Link to="/play" className="btn btn-primary">
          Back to Play
        </Link>
      </div>
    );
  }

  // Waiting for Player 2
  if (matchInfo.state === MATCH_STATE.WaitingForP2) {
    const isCreator = matchInfo.isPlayer1;

    if (isCreator) {
      // Creator's view - waiting for opponent
      return (
        <div className="container mx-auto px-4 py-12 max-w-xl">
          <motion.div
            className="card text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold mb-4">Waiting for Opponent</h1>

            <div className="mb-6">
              <div className="text-sm text-gray-400">Match #{matchId}</div>
              <div className="text-lg font-semibold">{GAME_MODE_NAMES[matchInfo.gameMode as GameMode]}</div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-400">Your Bet</div>
              <div className="text-2xl font-bold text-primary-400">
                {formatEther(matchInfo.betAmount)} ETH
              </div>
            </div>

            {matchInfo.isPrivate && (
              <div className="mb-6 p-4 bg-gray-900 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Share this Match ID:</div>
                <div className="font-mono text-lg">{matchId}</div>
              </div>
            )}

            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2">Match Expires</div>
              <Timer deadline={matchInfo.expiresAt} />
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => cancelMatch(parsedMatchId!)}
                disabled={isCancelling}
                className="btn btn-secondary"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Match'}
              </button>
            </div>
          </motion.div>
        </div>
      );
    } else {
      // Potential joiner's view
      return (
        <div className="container mx-auto px-4 py-12 max-w-xl">
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold mb-4 text-center">Join Match #{matchId}</h1>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Game Mode</span>
                <span className="font-semibold">{GAME_MODE_NAMES[matchInfo.gameMode as GameMode]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bet Amount</span>
                <span className="font-semibold text-primary-400">
                  {formatEther(matchInfo.betAmount)} ETH
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Created By</span>
                <span className="font-mono text-sm">
                  {matchInfo.player1.slice(0, 6)}...{matchInfo.player1.slice(-4)}
                </span>
              </div>
            </div>

            {matchInfo.isPrivate && (
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  Private Code
                </label>
                <input
                  type="text"
                  value={privateCode}
                  onChange={(e) => setPrivateCode(e.target.value)}
                  placeholder="Enter the private code"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-primary-500 focus:outline-none"
                />
              </div>
            )}

            {!isConnected ? (
              <div className="text-center text-gray-400">
                Connect your wallet to join
              </div>
            ) : (
              <button
                onClick={() => {
                  if (matchInfo.isPrivate) {
                    joinPrivateMatch(parsedMatchId!, privateCode, matchInfo.betAmount);
                  } else {
                    joinMatch(parsedMatchId!, matchInfo.betAmount);
                  }
                }}
                disabled={isJoining || isJoiningPrivate || (matchInfo.isPrivate && !privateCode)}
                className="w-full btn btn-primary py-3 text-lg"
              >
                {isJoining || isJoiningPrivate
                  ? 'Joining...'
                  : `Join Match (${formatEther(matchInfo.betAmount)} ETH)`}
              </button>
            )}
          </motion.div>
        </div>
      );
    }
  }

  // Active match - show battle arena
  if (
    matchInfo.state === MATCH_STATE.BothJoined ||
    matchInfo.state === MATCH_STATE.BothCommitted ||
    matchInfo.state === MATCH_STATE.P1Revealed ||
    matchInfo.state === MATCH_STATE.P2Revealed
  ) {
    if (!matchInfo.isParticipant) {
      return (
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Match in Progress</h1>
          <p className="text-gray-400">
            This match is being played by other players.
          </p>
        </div>
      );
    }

    return (
      <BattleArena
        matchId={parsedMatchId!}
        onMatchEnd={() => navigate('/my-battles')}
      />
    );
  }

  // Completed match
  if (matchInfo.state === MATCH_STATE.Completed) {
    const isWinner =
      (matchInfo.p1Wins > matchInfo.p2Wins && matchInfo.isPlayer1) ||
      (matchInfo.p2Wins > matchInfo.p1Wins && matchInfo.isPlayer2);
    const isDraw = matchInfo.p1Wins === matchInfo.p2Wins;

    return (
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <motion.div
          className="card text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h1 className="text-3xl font-bold mb-4">
            {isDraw ? 'Draw!' : isWinner ? 'Victory!' : 'Defeat'}
          </h1>

          <div className="text-6xl mb-6">{isDraw ? '🤝' : isWinner ? '🏆' : '😢'}</div>

          <div className="mb-6">
            <div className="text-4xl font-bold">
              {matchInfo.p1Wins} - {matchInfo.p2Wins}
            </div>
            <div className="text-gray-400">Final Score</div>
          </div>

          <div className="mb-6 p-4 bg-gray-900 rounded-lg">
            <div className="text-sm text-gray-400">
              {isDraw
                ? 'Both players refunded'
                : isWinner
                ? `You won ${formatEther(matchInfo.totalPot * 975n / 1000n)} ETH`
                : `You lost ${formatEther(matchInfo.betAmount)} ETH`}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRematch}
              disabled={isCreatingRematch}
              className="btn btn-primary w-full py-3"
            >
              {isCreatingRematch ? 'Creating...' : '🔄 Rematch'}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleShare} className="btn btn-secondary">
                📤 Share
              </button>
              <Link to="/play" className="btn btn-secondary text-center">
                🎮 New Match
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Expired or cancelled
  return (
    <div className="container mx-auto px-4 py-12 max-w-xl text-center">
      <h1 className="text-2xl font-bold mb-4">
        Match {matchInfo.state === MATCH_STATE.Expired ? 'Expired' : 'Cancelled'}
      </h1>
      <Link to="/play" className="btn btn-primary">
        Back to Play
      </Link>
    </div>
  );
}
