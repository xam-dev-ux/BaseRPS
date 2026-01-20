import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory store mapping wallet addresses to notification details
// In production, use a database like Vercel KV, Supabase, or similar
const walletToNotification: Map<string, { token: string; url: string; fid: number }> = new Map();

// Export for use in other endpoints
export { walletToNotification };

interface RegisterRequest {
  wallet: string;
  token: string;
  url: string;
  fid: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // Register wallet -> notification mapping
    try {
      const { wallet, token, url, fid } = req.body as RegisterRequest;

      if (!wallet || !token || !url) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const normalizedWallet = wallet.toLowerCase();
      walletToNotification.set(normalizedWallet, { token, url, fid });

      console.log(`Registered notification for wallet ${normalizedWallet}`);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'GET') {
    // Get notification details by wallet
    try {
      const { wallet } = req.query;

      if (!wallet || typeof wallet !== 'string') {
        return res.status(400).json({ error: 'Missing wallet parameter' });
      }

      const normalizedWallet = wallet.toLowerCase();
      const details = walletToNotification.get(normalizedWallet);

      if (!details) {
        return res.status(404).json({ error: 'Wallet not registered for notifications' });
      }

      return res.status(200).json(details);
    } catch (error) {
      console.error('Get registration error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
