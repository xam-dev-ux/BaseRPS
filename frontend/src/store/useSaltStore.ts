import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Choice } from '@/config/constants';

interface SaltEntry {
  matchId: string;
  round: number;
  choice: Choice;
  salt: `0x${string}`;
  commitHash: `0x${string}`;
  createdAt: number;
}

interface SaltStore {
  salts: SaltEntry[];
  addSalt: (
    matchId: bigint,
    round: number,
    choice: Choice,
    salt: `0x${string}`,
    commitHash: `0x${string}`
  ) => void;
  getSalt: (matchId: bigint, round: number) => SaltEntry | undefined;
  removeSalt: (matchId: bigint, round: number) => void;
  clearExpiredSalts: () => void;
  clearAllSalts: () => void;
}

// Use sessionStorage for security (cleared when browser closes)
export const useSaltStore = create<SaltStore>()(
  persist(
    (set, get) => ({
      salts: [],

      addSalt: (matchId, round, choice, salt, commitHash) => {
        set((state) => {
          // Remove any existing entry for this match/round first
          const filtered = state.salts.filter(
            (s) => !(s.matchId === matchId.toString() && s.round === round)
          );

          return {
            salts: [
              ...filtered,
              {
                matchId: matchId.toString(),
                round,
                choice,
                salt,
                commitHash,
                createdAt: Date.now(),
              },
            ],
          };
        });
      },

      getSalt: (matchId, round) => {
        return get().salts.find(
          (s) => s.matchId === matchId.toString() && s.round === round
        );
      },

      removeSalt: (matchId, round) => {
        set((state) => ({
          salts: state.salts.filter(
            (s) => !(s.matchId === matchId.toString() && s.round === round)
          ),
        }));
      },

      clearExpiredSalts: () => {
        const oneDay = 24 * 60 * 60 * 1000;
        set((state) => ({
          salts: state.salts.filter(
            (s) => Date.now() - s.createdAt < oneDay
          ),
        }));
      },

      clearAllSalts: () => {
        set({ salts: [] });
      },
    }),
    {
      name: 'baserps-salts',
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
    }
  )
);

// Utility hook to manage salts for a specific match
export function useMatchSalts(matchId: bigint) {
  const { addSalt, getSalt, removeSalt } = useSaltStore();

  return {
    addSalt: (
      round: number,
      choice: Choice,
      salt: `0x${string}`,
      commitHash: `0x${string}`
    ) => addSalt(matchId, round, choice, salt, commitHash),
    getSalt: (round: number) => getSalt(matchId, round),
    removeSalt: (round: number) => removeSalt(matchId, round),
  };
}
