import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Notification types for the game
export type NotificationType =
  | 'opponent-joined'
  | 'your-turn'
  | 'opponent-committed'
  | 'opponent-revealed'
  | 'round-result'
  | 'match-won'
  | 'match-lost'
  | 'match-draw'
  | 'overtime'
  | 'timeout-warning';

// Store for notification preferences
interface NotificationStore {
  enabled: boolean;
  permissionGranted: boolean;
  swRegistered: boolean;
  setEnabled: (enabled: boolean) => void;
  setPermissionGranted: (granted: boolean) => void;
  setSwRegistered: (registered: boolean) => void;
  toggle: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      enabled: true,
      permissionGranted: false,
      swRegistered: false,
      setEnabled: (enabled) => set({ enabled }),
      setPermissionGranted: (granted) => set({ permissionGranted: granted }),
      setSwRegistered: (registered) => set({ swRegistered: registered }),
      toggle: () => set((state) => ({ enabled: !state.enabled })),
    }),
    {
      name: 'baserps-notification-settings',
    }
  )
);

// Notification messages
const NOTIFICATION_MESSAGES: Record<NotificationType, { title: string; body: string }> = {
  'opponent-joined': {
    title: 'Battle Started!',
    body: 'Your opponent has joined. Make your move!',
  },
  'your-turn': {
    title: 'Your Turn!',
    body: 'Choose Rock, Paper, or Scissors!',
  },
  'opponent-committed': {
    title: 'Opponent Ready',
    body: 'Your opponent has made their choice. Waiting for reveal...',
  },
  'opponent-revealed': {
    title: 'Opponent Revealed',
    body: 'Your opponent revealed their choice!',
  },
  'round-result': {
    title: 'Round Complete',
    body: 'Check the results!',
  },
  'match-won': {
    title: 'Victory!',
    body: 'Congratulations! You won the match!',
  },
  'match-lost': {
    title: 'Defeat',
    body: 'Better luck next time!',
  },
  'match-draw': {
    title: 'Draw!',
    body: 'The match ended in a draw after 10 ties.',
  },
  overtime: {
    title: 'OVERTIME!',
    body: 'It\'s a tie! Choose again for overtime!',
  },
  'timeout-warning': {
    title: 'Time Running Out!',
    body: 'Make your move before time expires!',
  },
};

export function useNotifications() {
  const {
    enabled,
    permissionGranted,
    swRegistered,
    setEnabled,
    setPermissionGranted,
    setSwRegistered,
  } = useNotificationStore();
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Register service worker on mount
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service worker registered:', registration);
        setSwRegistration(registration);
        setSwRegistered(true);
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
        setSwRegistered(false);
      });
  }, [setSwRegistered]);

  // Check initial permission status
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, [setPermissionGranted]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermissionGranted(true);
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notifications denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [setPermissionGranted]);

  // Send a notification via service worker
  const sendNotification = useCallback(
    (type: NotificationType, matchId?: bigint, customBody?: string) => {
      if (!enabled || !permissionGranted) {
        return;
      }

      const message = NOTIFICATION_MESSAGES[type];
      if (!message) return;

      const notificationData = {
        type: 'SHOW_NOTIFICATION',
        title: message.title,
        body: customBody || message.body,
        url: matchId ? `/match/${matchId.toString()}` : '/play',
        matchId: matchId?.toString(),
        notificationType: type,
      };

      // Try to use service worker for background notifications
      if (swRegistration?.active) {
        swRegistration.active.postMessage(notificationData);
      } else if ('Notification' in window && Notification.permission === 'granted') {
        // Fallback to basic notification API
        const notification = new Notification(message.title, {
          body: customBody || message.body,
          icon: '/rps-icon.png',
          tag: matchId ? `match-${matchId}` : 'general',
        } as NotificationOptions);

        notification.onclick = () => {
          window.focus();
          if (matchId) {
            window.location.href = `/match/${matchId.toString()}`;
          }
          notification.close();
        };
      }
    },
    [enabled, permissionGranted, swRegistration]
  );

  // Send notification when tab is not focused
  const sendBackgroundNotification = useCallback(
    (type: NotificationType, matchId?: bigint, customBody?: string) => {
      if (document.hidden) {
        sendNotification(type, matchId, customBody);
      }
    },
    [sendNotification]
  );

  // Update page title for unfocused tab
  const updatePageTitle = useCallback((message: string, restore?: boolean) => {
    if (restore) {
      document.title = 'BaseRPS - Battle for ETH';
    } else {
      document.title = message;
    }
  }, []);

  // Flash title for attention
  const flashTitle = useCallback((message: string, interval = 1000) => {
    if (!document.hidden) return () => {};

    const originalTitle = document.title;
    let isFlashing = true;
    let showMessage = true;

    const flashInterval = setInterval(() => {
      if (!isFlashing) {
        document.title = originalTitle;
        clearInterval(flashInterval);
        return;
      }
      document.title = showMessage ? message : originalTitle;
      showMessage = !showMessage;
    }, interval);

    // Stop flashing when tab becomes visible
    const handleVisibility = () => {
      if (!document.hidden) {
        isFlashing = false;
        document.title = originalTitle;
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isFlashing = false;
      document.title = originalTitle;
      clearInterval(flashInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return {
    enabled,
    permissionGranted,
    swRegistered,
    setEnabled,
    requestPermission,
    sendNotification,
    sendBackgroundNotification,
    updatePageTitle,
    flashTitle,
  };
}
