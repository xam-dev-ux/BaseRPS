import { create } from 'zustand';
import type { Choice } from '@/config/constants';

type GamePhase = 'idle' | 'commit' | 'waiting-commit' | 'reveal' | 'waiting-reveal' | 'result' | 'overtime';

interface ActiveMatch {
  matchId: bigint;
  phase: GamePhase;
  currentRound: number;
  tieCount: number;
  myChoice: Choice | null;
  opponentCommitted: boolean;
  opponentRevealed: boolean;
  commitDeadline: number;
  revealDeadline: number;
  lastRoundWinner: `0x${string}` | null;
  isOvertime: boolean;
}

interface GameStore {
  activeMatch: ActiveMatch | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveMatch: (matchId: bigint) => void;
  updatePhase: (phase: GamePhase) => void;
  updateRound: (round: number, tieCount: number) => void;
  setMyChoice: (choice: Choice) => void;
  setOpponentCommitted: (committed: boolean) => void;
  setOpponentRevealed: (revealed: boolean) => void;
  setDeadlines: (commit: number, reveal: number) => void;
  setRoundResult: (winner: `0x${string}` | null, isOvertime: boolean) => void;
  resetForOvertime: (tieCount: number) => void;
  clearActiveMatch: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  activeMatch: null,
  isLoading: false,
  error: null,

  setActiveMatch: (matchId) => {
    set({
      activeMatch: {
        matchId,
        phase: 'idle',
        currentRound: 1,
        tieCount: 0,
        myChoice: null,
        opponentCommitted: false,
        opponentRevealed: false,
        commitDeadline: 0,
        revealDeadline: 0,
        lastRoundWinner: null,
        isOvertime: false,
      },
      error: null,
    });
  },

  updatePhase: (phase) => {
    set((state) => {
      if (!state.activeMatch) return state;
      return {
        activeMatch: { ...state.activeMatch, phase },
      };
    });
  },

  updateRound: (round, tieCount) => {
    set((state) => {
      if (!state.activeMatch) return state;
      return {
        activeMatch: {
          ...state.activeMatch,
          currentRound: round,
          tieCount,
          myChoice: null,
          opponentCommitted: false,
          opponentRevealed: false,
          isOvertime: tieCount > 0,
        },
      };
    });
  },

  setMyChoice: (choice) => {
    set((state) => {
      if (!state.activeMatch) return state;
      return {
        activeMatch: { ...state.activeMatch, myChoice: choice },
      };
    });
  },

  setOpponentCommitted: (committed) => {
    set((state) => {
      if (!state.activeMatch) return state;
      return {
        activeMatch: { ...state.activeMatch, opponentCommitted: committed },
      };
    });
  },

  setOpponentRevealed: (revealed) => {
    set((state) => {
      if (!state.activeMatch) return state;
      return {
        activeMatch: { ...state.activeMatch, opponentRevealed: revealed },
      };
    });
  },

  setDeadlines: (commit, reveal) => {
    set((state) => {
      if (!state.activeMatch) return state;
      return {
        activeMatch: {
          ...state.activeMatch,
          commitDeadline: commit,
          revealDeadline: reveal,
        },
      };
    });
  },

  setRoundResult: (winner, isOvertime) => {
    set((state) => {
      if (!state.activeMatch) return state;
      return {
        activeMatch: {
          ...state.activeMatch,
          lastRoundWinner: winner,
          isOvertime,
          phase: isOvertime ? 'overtime' : 'result',
        },
      };
    });
  },

  resetForOvertime: (tieCount) => {
    set((state) => {
      if (!state.activeMatch) return state;
      return {
        activeMatch: {
          ...state.activeMatch,
          phase: 'commit',
          tieCount,
          myChoice: null,
          opponentCommitted: false,
          opponentRevealed: false,
          isOvertime: true,
        },
      };
    });
  },

  clearActiveMatch: () => {
    set({ activeMatch: null, error: null });
  },

  setError: (error) => {
    set({ error });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));

// Selectors
export const useActiveMatch = () => useGameStore((state) => state.activeMatch);
export const useGamePhase = () => useGameStore((state) => state.activeMatch?.phase ?? 'idle');
export const useIsOvertime = () => useGameStore((state) => state.activeMatch?.isOvertime ?? false);
export const useTieCount = () => useGameStore((state) => state.activeMatch?.tieCount ?? 0);
