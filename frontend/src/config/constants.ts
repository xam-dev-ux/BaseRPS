export const CHOICE = {
  None: 0,
  Rock: 1,
  Paper: 2,
  Scissors: 3,
} as const;

export type Choice = (typeof CHOICE)[keyof typeof CHOICE];

export const CHOICE_NAMES: Record<Choice, string> = {
  [CHOICE.None]: 'None',
  [CHOICE.Rock]: 'Rock',
  [CHOICE.Paper]: 'Paper',
  [CHOICE.Scissors]: 'Scissors',
};

export const CHOICE_EMOJIS: Record<Choice, string> = {
  [CHOICE.None]: '❓',
  [CHOICE.Rock]: '🪨',
  [CHOICE.Paper]: '📄',
  [CHOICE.Scissors]: '✂️',
};

export const MATCH_STATE = {
  None: 0,
  WaitingForP2: 1,
  BothJoined: 2,
  BothCommitted: 3,
  P1Revealed: 4,
  P2Revealed: 5,
  Completed: 6,
  Expired: 7,
  Cancelled: 8,
} as const;

export type MatchState = (typeof MATCH_STATE)[keyof typeof MATCH_STATE];

export const MATCH_STATE_NAMES: Record<MatchState, string> = {
  [MATCH_STATE.None]: 'None',
  [MATCH_STATE.WaitingForP2]: 'Waiting for Opponent',
  [MATCH_STATE.BothJoined]: 'Commit Phase',
  [MATCH_STATE.BothCommitted]: 'Reveal Phase',
  [MATCH_STATE.P1Revealed]: 'Waiting for P2 Reveal',
  [MATCH_STATE.P2Revealed]: 'Waiting for P1 Reveal',
  [MATCH_STATE.Completed]: 'Completed',
  [MATCH_STATE.Expired]: 'Expired',
  [MATCH_STATE.Cancelled]: 'Cancelled',
};

export const GAME_MODE = {
  BO1: 0,
  BO3: 1,
  BO5: 2,
} as const;

export type GameMode = (typeof GAME_MODE)[keyof typeof GAME_MODE];

export const GAME_MODE_NAMES: Record<GameMode, string> = {
  [GAME_MODE.BO1]: 'Best of 1',
  [GAME_MODE.BO3]: 'Best of 3',
  [GAME_MODE.BO5]: 'Best of 5',
};

export const WINS_REQUIRED: Record<GameMode, number> = {
  [GAME_MODE.BO1]: 1,
  [GAME_MODE.BO3]: 2,
  [GAME_MODE.BO5]: 3,
};

export const MAX_TIES_PER_ROUND = 10;

export const COMMIT_TIMEOUT = 60; // seconds
export const REVEAL_TIMEOUT = 60; // seconds

export const OVERTIME_LEVELS = {
  CALM: { min: 0, max: 0, color: 'overtime-calm', name: 'Normal' },
  MILD: { min: 1, max: 2, color: 'overtime-mild', name: 'Mild' },
  MODERATE: { min: 3, max: 5, color: 'overtime-moderate', name: 'Moderate' },
  INTENSE: { min: 6, max: 8, color: 'overtime-intense', name: 'Intense' },
  EPIC: { min: 9, max: 10, color: 'overtime-epic', name: 'Epic' },
} as const;

export function getOvertimeLevel(tieCount: number) {
  if (tieCount >= OVERTIME_LEVELS.EPIC.min) return OVERTIME_LEVELS.EPIC;
  if (tieCount >= OVERTIME_LEVELS.INTENSE.min) return OVERTIME_LEVELS.INTENSE;
  if (tieCount >= OVERTIME_LEVELS.MODERATE.min) return OVERTIME_LEVELS.MODERATE;
  if (tieCount >= OVERTIME_LEVELS.MILD.min) return OVERTIME_LEVELS.MILD;
  return OVERTIME_LEVELS.CALM;
}
