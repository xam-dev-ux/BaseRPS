import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import sdk from '@farcaster/frame-sdk';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Push notification types
export type PushNotificationType =
  | 'opponent-joined'
  | 'your-turn'
  | 'match-won'
  | 'match-lost'
  | 'match-draw'
  | 'overtime';

// Store for notification details
interface NotificationDetails {
  token: string;
  url: string;
}

interface PushNotificationStore {
  isAdded: boolean;
  notificationDetails: NotificationDetails | null;
  fid: number | null;
  setAdded: (added: boolean) => void;
  setNotificationDetails: (details: NotificationDetails | null) => void;
  setFid: (fid: number | null) => void;
}

export const usePushNotificationStore = create<PushNotificationStore>()(
  persist(
    (set) => ({
      isAdded: false,
      notificationDetails: null,
      fid: null,
      setAdded: (added) => set({ isAdded: added }),
      setNotificationDetails: (details) => set({ notificationDetails: details }),
      setFid: (fid) => set({ fid }),
    }),
    {
      name: 'baserps-push-notifications',
    }
  )
);

export function usePushNotifications() {
  const { address } = useAccount();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isAdded,
    notificationDetails,
    fid,
    setAdded,
    setNotificationDetails,
    setFid,
  } = usePushNotificationStore();

  // Initialize SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        // Check if we're in a mini app context
        const context = await sdk.context;

        if (context) {
          setIsInMiniApp(true);
          setFid(context.user?.fid || null);

          // Check if app is already added
          if (context.client?.added) {
            setAdded(true);
            if (context.client.notificationDetails) {
              setNotificationDetails({
                token: context.client.notificationDetails.token,
                url: context.client.notificationDetails.url,
              });
            }
          }
        }

        setIsSDKLoaded(true);

        // Signal that we're ready
        sdk.actions.ready();
      } catch (err) {
        console.log('Not in mini app context or SDK error:', err);
        setIsSDKLoaded(true);
      }
    };

    initSDK();
  }, [setAdded, setNotificationDetails, setFid]);

  // Register wallet with notification token
  const registerWallet = useCallback(
    async (token: string, url: string, userFid: number) => {
      if (!address) return;

      try {
        await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: address,
            token,
            url,
            fid: userFid,
          }),
        });
        console.log('Wallet registered for notifications:', address);
      } catch (err) {
        console.error('Failed to register wallet:', err);
      }
    },
    [address]
  );

  // Request to add mini app (enable notifications)
  const enableNotifications = useCallback(async () => {
    if (!isSDKLoaded || !isInMiniApp) {
      setError('SDK not loaded or not in mini app');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await sdk.actions.addFrame();

      // If notificationDetails is present, the user enabled notifications
      if (result.notificationDetails) {
        setAdded(true);
        const { token, url } = result.notificationDetails;
        setNotificationDetails({ token, url });

        // Register wallet -> notification mapping on server
        if (fid) {
          await registerWallet(token, url, fid);
        }
        return true;
      } else {
        // User added but without notifications, or declined
        setAdded(true);
        return true;
      }
    } catch (err) {
      // User rejected or error occurred
      console.error('Error enabling notifications:', err);
      setError('Failed to enable notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSDKLoaded, isInMiniApp, setAdded, setNotificationDetails, fid, registerWallet]);

  // Send push notification via API
  const sendPushNotification = useCallback(
    async (
      type: PushNotificationType,
      matchId: string,
      targetToken?: string,
      targetUrl?: string
    ) => {
      // Use provided token/url or stored ones
      const token = targetToken || notificationDetails?.token;
      const url = targetUrl || notificationDetails?.url;

      if (!token || !url) {
        console.log('No notification token available');
        return false;
      }

      try {
        const response = await fetch('/api/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            matchId,
            targetToken: token,
            targetUrl: url,
          }),
        });

        if (!response.ok) {
          console.error('Failed to send push notification');
          return false;
        }

        return true;
      } catch (err) {
        console.error('Error sending push notification:', err);
        return false;
      }
    },
    [notificationDetails]
  );

  // Notify opponent by wallet address
  const notifyOpponent = useCallback(
    async (type: PushNotificationType, matchId: string, opponentWallet: string) => {
      try {
        const response = await fetch('/api/notify-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            matchId,
            targetWallet: opponentWallet,
          }),
        });

        if (!response.ok) {
          console.error('Failed to notify opponent');
          return false;
        }

        const result = await response.json();
        return result.success;
      } catch (err) {
        console.error('Error notifying opponent:', err);
        return false;
      }
    },
    []
  );

  return {
    isSDKLoaded,
    isInMiniApp,
    isAdded,
    isLoading,
    error,
    fid,
    notificationDetails,
    enableNotifications,
    sendPushNotification,
    notifyOpponent,
  };
}
