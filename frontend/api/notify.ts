import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Notification types for BaseRPS
type NotificationType =
  | 'opponent-joined'
  | 'your-turn'
  | 'match-won'
  | 'match-lost'
  | 'match-draw'
  | 'overtime';

interface NotifyRequest {
  type: NotificationType;
  matchId: string;
  targetFid?: number;
  targetToken?: string;
  targetUrl?: string;
}

// Notification templates
const NOTIFICATION_TEMPLATES: Record<NotificationType, { title: string; body: string }> = {
  'opponent-joined': {
    title: 'Match Started!',
    body: 'An opponent joined your match. Make your move!',
  },
  'your-turn': {
    title: 'Your Turn!',
    body: 'Your opponent made their move. Time to play!',
  },
  'match-won': {
    title: 'Victory!',
    body: 'Congratulations! You won the match!',
  },
  'match-lost': {
    title: 'Match Complete',
    body: 'Better luck next time! Create a rematch?',
  },
  'match-draw': {
    title: 'Draw!',
    body: 'The match ended in a draw. Your bet was refunded.',
  },
  'overtime': {
    title: 'Overtime!',
    body: 'It\'s a tie! Choose again to break it!',
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, matchId, targetToken, targetUrl } = req.body as NotifyRequest;

    if (!type || !NOTIFICATION_TEMPLATES[type]) {
      return res.status(400).json({ error: 'Invalid notification type' });
    }

    if (!targetToken || !targetUrl) {
      return res.status(400).json({ error: 'Missing targetToken or targetUrl' });
    }

    const template = NOTIFICATION_TEMPLATES[type];
    const appUrl = process.env.VITE_APP_URL || 'https://base-rps-eight.vercel.app';

    // Send notification via Farcaster
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId: crypto.randomUUID(),
        title: template.title,
        body: template.body,
        targetUrl: `${appUrl}/match/${matchId}`,
        tokens: [targetToken],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send notification:', errorText);
      return res.status(500).json({ error: 'Failed to send notification', details: errorText });
    }

    const result = await response.json();
    console.log('Notification sent successfully:', result);

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Notify error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
