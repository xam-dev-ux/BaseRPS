import { motion, AnimatePresence } from 'framer-motion';
import { useOvertimeUI, getOvertimeBorderClass } from '@/hooks/useOvertimeUI';
import { MAX_TIES_PER_ROUND } from '@/config/constants';

interface OvertimeIndicatorProps {
  tieCount: number;
  className?: string;
}

export function OvertimeIndicator({ tieCount, className = '' }: OvertimeIndicatorProps) {
  const { isOvertime, showWarning, shouldShake, shouldPulse, message, level, progress } =
    useOvertimeUI(tieCount);

  if (!isOvertime) return null;

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-lg p-4
        border-2 ${getOvertimeBorderClass(tieCount)}
        ${shouldShake ? 'animate-shake' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Background effect */}
      <div
        className={`absolute inset-0 ${level.color} opacity-20`}
        style={{
          background: `radial-gradient(circle at center, var(--tw-gradient-from) 0%, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <motion.div
          className={`text-lg font-bold uppercase tracking-wider ${
            showWarning ? 'text-red-400' : 'text-white'
          }`}
          animate={shouldPulse ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          {message}
        </motion.div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              showWarning ? 'bg-red-500' : 'bg-orange-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Tie dots */}
        <div className="flex gap-1 mt-1">
          {Array.from({ length: MAX_TIES_PER_ROUND }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < tieCount
                  ? showWarning
                    ? 'bg-red-500'
                    : 'bg-orange-500'
                  : 'bg-gray-600'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: i < tieCount ? 1 : 0.5 }}
              transition={{ delay: i * 0.05 }}
            />
          ))}
        </div>
      </div>

      {/* Warning flash for high ties */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            className="absolute inset-0 bg-red-500/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface OvertimeBannerProps {
  tieCount: number;
}

export function OvertimeBanner({ tieCount }: OvertimeBannerProps) {
  const { isOvertime, showWarning, message } = useOvertimeUI(tieCount);

  if (!isOvertime) return null;

  return (
    <motion.div
      className={`
        w-full py-2 px-4 text-center font-bold uppercase tracking-wider
        ${showWarning ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'}
      `}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    >
      <motion.span
        animate={showWarning ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.3 }}
      >
        {message}
      </motion.span>
    </motion.div>
  );
}
