import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory store for notification tokens (use a database in production)
// This will be reset on each deployment, consider using Vercel KV or a database
const notificationTokens: Map<string, { token: string; url: string; fid: number }> = new Map();

// Export for use in notify endpoint
export { notificationTokens };

interface WebhookEvent {
  event: 'mini_app_added' | 'mini_app_removed';
  fid: number;
  notificationDetails?: {
    token: string;
    url: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body as WebhookEvent;

    console.log('Webhook received:', event);

    if (event.event === 'mini_app_added' && event.notificationDetails) {
      // User enabled notifications - store their token
      const { token, url } = event.notificationDetails;
      notificationTokens.set(String(event.fid), {
        token,
        url,
        fid: event.fid,
      });
      console.log(`Notification token stored for FID ${event.fid}`);
    } else if (event.event === 'mini_app_removed') {
      // User removed the app - delete their token
      notificationTokens.delete(String(event.fid));
      console.log(`Notification token removed for FID ${event.fid}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
