import { useCallback, useRef } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Sound effect store for persisting user preference
interface SoundStore {
  enabled: boolean;
  volume: number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  toggle: () => void;
}

export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      enabled: true,
      volume: 0.5,
      setEnabled: (enabled) => set({ enabled }),
      setVolume: (volume) => set({ volume }),
      toggle: () => set((state) => ({ enabled: !state.enabled })),
    }),
    {
      name: 'baserps-sound-settings',
    }
  )
);

// Sound effect types
export type SoundEffect =
  | 'click'
  | 'commit'
  | 'reveal'
  | 'win'
  | 'lose'
  | 'tie'
  | 'tie-warning'
  | 'tie-critical'
  | 'draw'
  | 'countdown'
  | 'match-start'
  | 'notification';

// Generate sounds using Web Audio API (no external files needed)
function createOscillatorSound(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3
): void {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playClickSound(ctx: AudioContext, volume: number) {
  createOscillatorSound(ctx, 800, 0.1, 'sine', volume * 0.3);
}

function playCommitSound(ctx: AudioContext, volume: number) {
  createOscillatorSound(ctx, 440, 0.15, 'sine', volume * 0.4);
  setTimeout(() => createOscillatorSound(ctx, 554, 0.15, 'sine', volume * 0.4), 100);
}

function playRevealSound(ctx: AudioContext, volume: number) {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => createOscillatorSound(ctx, 300 + i * 100, 0.1, 'square', volume * 0.2), i * 80);
  }
}

function playWinSound(ctx: AudioContext, volume: number) {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => createOscillatorSound(ctx, freq, 0.3, 'sine', volume * 0.4), i * 100);
  });
}

function playLoseSound(ctx: AudioContext, volume: number) {
  const notes = [392, 349, 311, 262]; // G4, F4, Eb4, C4
  notes.forEach((freq, i) => {
    setTimeout(() => createOscillatorSound(ctx, freq, 0.25, 'sine', volume * 0.3), i * 150);
  });
}

function playTieSound(ctx: AudioContext, volume: number, intensity: number = 1) {
  // More intense as ties increase
  const baseFreq = 440;
  const duration = 0.2 + intensity * 0.05;
  createOscillatorSound(ctx, baseFreq, duration, 'sawtooth', volume * 0.3 * intensity);
  setTimeout(() => createOscillatorSound(ctx, baseFreq * 1.5, duration, 'sawtooth', volume * 0.3 * intensity), 100);
}

function playTieWarningSound(ctx: AudioContext, volume: number) {
  // Alarm-like sound for 7+ ties
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      createOscillatorSound(ctx, 880, 0.1, 'square', volume * 0.4);
    }, i * 200);
  }
}

function playTieCriticalSound(ctx: AudioContext, volume: number) {
  // Urgent siren for 9+ ties
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      const freq = i % 2 === 0 ? 880 : 660;
      createOscillatorSound(ctx, freq, 0.15, 'sawtooth', volume * 0.5);
    }, i * 150);
  }
}

function playDrawSound(ctx: AudioContext, volume: number) {
  // Descending "wah wah" sound
  const notes = [440, 392, 349, 311];
  notes.forEach((freq, i) => {
    setTimeout(() => createOscillatorSound(ctx, freq, 0.4, 'triangle', volume * 0.3), i * 300);
  });
}

function playCountdownSound(ctx: AudioContext, volume: number) {
  createOscillatorSound(ctx, 1000, 0.05, 'sine', volume * 0.2);
}

function playMatchStartSound(ctx: AudioContext, volume: number) {
  createOscillatorSound(ctx, 523, 0.1, 'sine', volume * 0.4);
  setTimeout(() => createOscillatorSound(ctx, 659, 0.1, 'sine', volume * 0.4), 100);
  setTimeout(() => createOscillatorSound(ctx, 784, 0.2, 'sine', volume * 0.5), 200);
}

function playNotificationSound(ctx: AudioContext, volume: number) {
  createOscillatorSound(ctx, 880, 0.1, 'sine', volume * 0.3);
  setTimeout(() => createOscillatorSound(ctx, 1100, 0.15, 'sine', volume * 0.3), 120);
}

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const { enabled, volume } = useSoundStore();

  // Initialize audio context on first user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (required by browsers)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Play a sound effect
  const play = useCallback(
    (effect: SoundEffect, tieCount?: number) => {
      if (!enabled) return;

      const ctx = initAudioContext();
      if (!ctx) return;

      switch (effect) {
        case 'click':
          playClickSound(ctx, volume);
          break;
        case 'commit':
          playCommitSound(ctx, volume);
          break;
        case 'reveal':
          playRevealSound(ctx, volume);
          break;
        case 'win':
          playWinSound(ctx, volume);
          break;
        case 'lose':
          playLoseSound(ctx, volume);
          break;
        case 'tie':
          playTieSound(ctx, volume, Math.min((tieCount || 1) / 3, 2));
          break;
        case 'tie-warning':
          playTieWarningSound(ctx, volume);
          break;
        case 'tie-critical':
          playTieCriticalSound(ctx, volume);
          break;
        case 'draw':
          playDrawSound(ctx, volume);
          break;
        case 'countdown':
          playCountdownSound(ctx, volume);
          break;
        case 'match-start':
          playMatchStartSound(ctx, volume);
          break;
        case 'notification':
          playNotificationSound(ctx, volume);
          break;
      }
    },
    [enabled, volume, initAudioContext]
  );

  // Play tie sound with appropriate intensity based on count
  const playTie = useCallback(
    (tieCount: number) => {
      if (tieCount >= 9) {
        play('tie-critical');
      } else if (tieCount >= 7) {
        play('tie-warning');
      } else {
        play('tie', tieCount);
      }
    },
    [play]
  );

  return {
    play,
    playTie,
    enabled,
    volume,
  };
}
