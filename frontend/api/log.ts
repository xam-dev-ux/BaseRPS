import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { level, message, data } = req.body;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level || 'info',
    message,
    data,
  };

  // This will appear in Vercel logs
  if (level === 'error') {
    console.error('[Frontend]', JSON.stringify(logEntry));
  } else if (level === 'warn') {
    console.warn('[Frontend]', JSON.stringify(logEntry));
  } else {
    console.log('[Frontend]', JSON.stringify(logEntry));
  }

  return res.status(200).json({ success: true });
}
