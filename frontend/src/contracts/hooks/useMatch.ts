import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useMatch as useMatchData, useRoundState } from './useBaseRPS';
import { MATCH_STATE, type MatchState, type Choice } from '@/config/constants';

export interface MatchInfo {
  matchId: bigint;
  player1: `0x${string}`;
  player2: `0x${string}`;
  betAmount: bigint;
  createdAt: number;
  expiresAt: number;
  p1Wins: number;
  p2Wins: number;
  currentRound: number;
  gameMode: number;
  state: MatchState;
  isPrivate: boolean;
  totalPot: bigint;
  isPlayer1: boolean;
  isPlayer2: boolean;
  isParticipant: boolean;
}

export interface RoundInfo {
  p1Commit: `0x${string}`;
  p2Commit: `0x${string}`;
  p1Choice: Choice;
  p2Choice: Choice;
  tieCount: number;
  commitDeadline: number;
  revealDeadline: number;
  p1Revealed: boolean;
  p2Revealed: boolean;
  myCommitted: boolean;
  opponentCommitted: boolean;
  myRevealed: boolean;
  opponentRevealed: boolean;
}

export function useMatchInfo(matchId: bigint | undefined) {
  const { address } = useAccount();
  const { data: matchData, isLoading, error, refetch } = useMatchData(matchId);

  const matchInfo = useMemo<MatchInfo | null>(() => {
    if (!matchData || !matchId) return null;

    const match = matchData as {
      player1: `0x${string}`;
      player2: `0x${string}`;
      betAmount: bigint;
      createdAt: number;
      expiresAt: number;
      p1Wins: number;
      p2Wins: number;
      currentRound: number;
      gameMode: number;
      state: number;
      isPrivate: boolean;
    };

    const isPlayer1 = address?.toLowerCase() === match.player1.toLowerCase();
    const isPlayer2 = address?.toLowerCase() === match.player2.toLowerCase();

    return {
      matchId,
      player1: match.player1,
      player2: match.player2,
      betAmount: match.betAmount,
      createdAt: Number(match.createdAt),
      expiresAt: Number(match.expiresAt),
      p1Wins: Number(match.p1Wins),
      p2Wins: Number(match.p2Wins),
      currentRound: Number(match.currentRound),
      gameMode: Number(match.gameMode),
      state: Number(match.state) as MatchState,
      isPrivate: match.isPrivate,
      totalPot: match.betAmount * 2n,
      isPlayer1,
      isPlayer2,
      isParticipant: isPlayer1 || isPlayer2,
    };
  }, [matchData, matchId, address]);

  return {
    matchInfo,
    isLoading,
    error,
    refetch,
  };
}

export function useRoundInfo(matchId: bigint | undefined, round: number) {
  const { address } = useAccount();
  const { data: matchData } = useMatchData(matchId);
  const { data: roundData, isLoading, error, refetch } = useRoundState(matchId, round);

  const roundInfo = useMemo<RoundInfo | null>(() => {
    if (!roundData || !matchData) return null;

    const match = matchData as { player1: `0x${string}` };
    const rs = roundData as {
      p1Commit: `0x${string}`;
      p2Commit: `0x${string}`;
      p1Choice: number;
      p2Choice: number;
      tieCount: number;
      commitDeadline: number;
      revealDeadline: number;
      p1Revealed: boolean;
      p2Revealed: boolean;
    };

    const isPlayer1 = address?.toLowerCase() === match.player1.toLowerCase();

    const zeroBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

    return {
      p1Commit: rs.p1Commit,
      p2Commit: rs.p2Commit,
      p1Choice: Number(rs.p1Choice) as Choice,
      p2Choice: Number(rs.p2Choice) as Choice,
      tieCount: Number(rs.tieCount),
      commitDeadline: Number(rs.commitDeadline),
      revealDeadline: Number(rs.revealDeadline),
      p1Revealed: rs.p1Revealed,
      p2Revealed: rs.p2Revealed,
      myCommitted: isPlayer1 ? rs.p1Commit !== zeroBytes32 : rs.p2Commit !== zeroBytes32,
      opponentCommitted: isPlayer1 ? rs.p2Commit !== zeroBytes32 : rs.p1Commit !== zeroBytes32,
      myRevealed: isPlayer1 ? rs.p1Revealed : rs.p2Revealed,
      opponentRevealed: isPlayer1 ? rs.p2Revealed : rs.p1Revealed,
    };
  }, [roundData, matchData, address]);

  return {
    roundInfo,
    isLoading,
    error,
    refetch,
  };
}

export function useMatchPhase(matchInfo: MatchInfo | null, roundInfo: RoundInfo | null) {
  if (!matchInfo) return 'loading';

  switch (matchInfo.state) {
    case MATCH_STATE.WaitingForP2:
      return 'waiting';
    case MATCH_STATE.BothJoined:
      return roundInfo?.myCommitted ? 'waiting-opponent-commit' : 'commit';
    case MATCH_STATE.BothCommitted:
    case MATCH_STATE.P1Revealed:
    case MATCH_STATE.P2Revealed:
      return roundInfo?.myRevealed ? 'waiting-opponent-reveal' : 'reveal';
    case MATCH_STATE.Completed:
      return 'completed';
    case MATCH_STATE.Expired:
      return 'expired';
    case MATCH_STATE.Cancelled:
      return 'cancelled';
    default:
      return 'unknown';
  }
}
