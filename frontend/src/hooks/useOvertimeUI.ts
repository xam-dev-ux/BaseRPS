import { useMemo, useEffect, useState } from 'react';
import { getOvertimeLevel, MAX_TIES_PER_ROUND } from '@/config/constants';

interface OvertimeUIState {
  level: ReturnType<typeof getOvertimeLevel>;
  isOvertime: boolean;
  tieCount: number;
  progress: number; // 0-100 progress towards draw
  className: string;
  showWarning: boolean;
  shouldShake: boolean;
  shouldPulse: boolean;
  message: string;
}

export function useOvertimeUI(tieCount: number): OvertimeUIState {
  const [shouldShake, setShouldShake] = useState(false);

  // Trigger shake animation on tie count change
  useEffect(() => {
    if (tieCount > 0) {
      setShouldShake(true);
      const timeout = setTimeout(() => setShouldShake(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [tieCount]);

  return useMemo(() => {
    const level = getOvertimeLevel(tieCount);
    const isOvertime = tieCount > 0;
    const progress = (tieCount / MAX_TIES_PER_ROUND) * 100;
    const showWarning = tieCount >= 9;

    let message = '';
    if (tieCount === 0) {
      message = '';
    } else if (tieCount === 9) {
      message = 'ONE MORE TIE = DRAW!';
    } else if (tieCount === 10) {
      message = 'DRAW! Match ended in a tie.';
    } else {
      message = `OVERTIME ${tieCount}/10`;
    }

    const shouldPulse = tieCount >= 3;

    return {
      level,
      isOvertime,
      tieCount,
      progress,
      className: isOvertime ? level.color : '',
      showWarning,
      shouldShake,
      shouldPulse,
      message,
    };
  }, [tieCount, shouldShake]);
}

// Hook for playing overtime sounds
export function useOvertimeSounds(tieCount: number, soundEnabled: boolean = true) {
  useEffect(() => {
    if (!soundEnabled || tieCount === 0) return;

    // Play appropriate sound based on tie count
    const playSound = async (soundUrl: string) => {
      try {
        const audio = new Audio(soundUrl);
        audio.volume = 0.5;
        await audio.play();
      } catch (error) {
        // Audio play failed (likely user hasn't interacted with page)
        console.debug('Could not play sound:', error);
      }
    };

    if (tieCount === 9) {
      // Warning sound
      playSound('/sounds/warning.mp3');
    } else if (tieCount >= 6) {
      // Intense sound
      playSound('/sounds/intense.mp3');
    } else if (tieCount >= 1) {
      // Tie sound
      playSound('/sounds/tie.mp3');
    }
  }, [tieCount, soundEnabled]);
}

// CSS class utility for overtime backgrounds
export function getOvertimeBackgroundClass(tieCount: number): string {
  if (tieCount === 0) return 'bg-gray-900';
  if (tieCount <= 2) return 'bg-gradient-to-b from-gray-900 to-indigo-950';
  if (tieCount <= 5) return 'bg-gradient-to-b from-gray-900 to-purple-950';
  if (tieCount <= 8) return 'bg-gradient-to-b from-gray-900 to-orange-950';
  return 'bg-gradient-to-b from-gray-900 to-red-950';
}

// Border class utility
export function getOvertimeBorderClass(tieCount: number): string {
  if (tieCount === 0) return 'border-gray-700';
  if (tieCount <= 2) return 'border-indigo-500';
  if (tieCount <= 5) return 'border-purple-500';
  if (tieCount <= 8) return 'border-orange-500';
  return 'border-red-500';
}
