import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  deadline: number; // Unix timestamp in seconds
  onExpired?: () => void;
  className?: string;
  showProgressBar?: boolean;
  warningThreshold?: number; // seconds
}

export function Timer({
  deadline,
  onExpired,
  className = '',
  showProgressBar = true,
  warningThreshold = 10,
}: TimerProps) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeLeft = useMemo(() => {
    const diff = deadline - now;
    return Math.max(0, diff);
  }, [deadline, now]);

  useEffect(() => {
    if (timeLeft === 0 && onExpired) {
      onExpired();
    }
  }, [timeLeft, onExpired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft <= warningThreshold && timeLeft > 0;
  const isExpired = timeLeft === 0;

  // Calculate progress for bar (assuming 60 second timeout)
  const totalTime = 60;
  const progress = Math.min(100, (timeLeft / totalTime) * 100);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.div
        className={`text-2xl font-mono font-bold ${
          isExpired
            ? 'text-red-500'
            : isWarning
            ? 'text-orange-400'
            : 'text-white'
        }`}
        animate={isWarning ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
      >
        {isExpired ? (
          'EXPIRED'
        ) : (
          <>
            {minutes.toString().padStart(2, '0')}:
            {seconds.toString().padStart(2, '0')}
          </>
        )}
      </motion.div>

      {showProgressBar && (
        <div className="w-full h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              isWarning ? 'bg-orange-500' : 'bg-primary-500'
            }`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </div>
  );
}
