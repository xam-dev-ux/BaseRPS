// Log to Vercel server (appears in Vercel dashboard logs)
export async function serverLog(
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>
) {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, data }),
    });
  } catch (err) {
    // Silently fail - don't break the app if logging fails
    console.error('Failed to send server log:', err);
  }
}

export const log = {
  info: (message: string, data?: Record<string, unknown>) => serverLog('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => serverLog('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => serverLog('error', message, data),
};
