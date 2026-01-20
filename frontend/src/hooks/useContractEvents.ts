import { useWatchContractEvent, useAccount } from 'wagmi';
import { useBaseRPSContract } from '@/contracts/hooks/useBaseRPS';
import { useGameStore } from '@/store/useGameStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useNotifications } from '@/hooks/useNotifications';
import { zeroAddress, type Log } from 'viem';
import toast from 'react-hot-toast';

// Type helper for event logs with args
type EventLog<T> = Log & { args: T };

interface UseContractEventsProps {
  matchId: bigint;
  onMatchJoined?: (player2: `0x${string}`) => void;
  onOpponentCommitted?: () => void;
  onOpponentRevealed?: (choice: number) => void;
  onRoundResult?: (winner: `0x${string}`, tieCount: number, isOvertime: boolean) => void;
  onMatchCompleted?: (winner: `0x${string}`, payout: bigint, wasDraw: boolean) => void;
}

export function useContractEvents({
  matchId,
  onMatchJoined,
  onOpponentCommitted,
  onOpponentRevealed,
  onRoundResult,
  onMatchCompleted,
}: UseContractEventsProps) {
  const { address } = useAccount();
  const { address: contractAddress, abi } = useBaseRPSContract();
  const { play, playTie } = useSoundEffects();
  const { sendBackgroundNotification, flashTitle } = useNotifications();
  const {
    setOpponentCommitted,
    setOpponentRevealed,
    setRoundResult,
    resetForOvertime,
  } = useGameStore();

  // Watch for MatchJoined events
  useWatchContractEvent({
    address: contractAddress,
    abi,
    eventName: 'MatchJoined',
    args: { matchId },
    onLogs: (logs) => {
      for (const log of logs) {
        const typedLog = log as unknown as EventLog<{ player2: `0x${string}` }>;
        const player2 = typedLog.args.player2;
        if (player2.toLowerCase() !== address?.toLowerCase()) {
          play('match-start');
          sendBackgroundNotification('opponent-joined', matchId);
          flashTitle('Battle Started!');
          toast.success('Opponent joined! Battle begins!');
          onMatchJoined?.(player2);
        }
      }
    },
  });

  // Watch for ChoiceCommitted events
  useWatchContractEvent({
    address: contractAddress,
    abi,
    eventName: 'ChoiceCommitted',
    args: { matchId },
    onLogs: (logs) => {
      for (const log of logs) {
        const typedLog = log as unknown as EventLog<{ player: `0x${string}` }>;
        const player = typedLog.args.player;
        if (player.toLowerCase() !== address?.toLowerCase()) {
          setOpponentCommitted(true);
          sendBackgroundNotification('opponent-committed', matchId);
          toast('Opponent has committed their choice!', { icon: '🎯' });
          onOpponentCommitted?.();
        }
      }
    },
  });

  // Watch for ChoiceRevealed events
  useWatchContractEvent({
    address: contractAddress,
    abi,
    eventName: 'ChoiceRevealed',
    args: { matchId },
    onLogs: (logs) => {
      for (const log of logs) {
        const typedLog = log as unknown as EventLog<{ player: `0x${string}`; choice: number }>;
        const args = typedLog.args;
        if (args.player.toLowerCase() !== address?.toLowerCase()) {
          setOpponentRevealed(true);
          sendBackgroundNotification('opponent-revealed', matchId);
          onOpponentRevealed?.(args.choice);
        }
      }
    },
  });

  // Watch for RoundResult events
  useWatchContractEvent({
    address: contractAddress,
    abi,
    eventName: 'RoundResult',
    args: { matchId },
    onLogs: (logs) => {
      for (const log of logs) {
        const typedLog = log as unknown as EventLog<{ winner: `0x${string}`; tieCount: number; isOvertime: boolean }>;
        const args = typedLog.args;

        if (args.winner === zeroAddress) {
          // Tie - overtime
          playTie(args.tieCount);
          sendBackgroundNotification('overtime', matchId, `Overtime round ${args.tieCount}! Choose again!`);
          flashTitle('OVERTIME!');
          toast('TIE! Overtime round!', { icon: '🔥' });
          resetForOvertime(args.tieCount);
        } else if (args.winner.toLowerCase() === address?.toLowerCase()) {
          play('win');
          sendBackgroundNotification('round-result', matchId, 'You won this round!');
          toast.success('You won this round!');
        } else {
          play('lose');
          sendBackgroundNotification('round-result', matchId, 'You lost this round!');
          toast.error('You lost this round!');
        }

        setRoundResult(args.winner, args.isOvertime);
        onRoundResult?.(args.winner, args.tieCount, args.isOvertime);
      }
    },
  });

  // Watch for MatchCompleted events
  useWatchContractEvent({
    address: contractAddress,
    abi,
    eventName: 'MatchCompleted',
    args: { matchId },
    onLogs: (logs) => {
      for (const log of logs) {
        const typedLog = log as unknown as EventLog<{ winner: `0x${string}`; winnerPayout: bigint; wasDraw: boolean }>;
        const args = typedLog.args;

        if (args.wasDraw) {
          play('draw');
          sendBackgroundNotification('match-draw', matchId);
          flashTitle('Match Draw!');
          toast('Match ended in a draw! Bets refunded.', { icon: '🤝' });
        } else if (args.winner.toLowerCase() === address?.toLowerCase()) {
          play('win');
          sendBackgroundNotification('match-won', matchId);
          flashTitle('Victory!');
          toast.success('Victory! You won the match!');
        } else {
          play('lose');
          sendBackgroundNotification('match-lost', matchId);
          flashTitle('Defeat!');
          toast.error('Defeat! Better luck next time!');
        }

        onMatchCompleted?.(args.winner, args.winnerPayout, args.wasDraw);
      }
    },
  });
}
