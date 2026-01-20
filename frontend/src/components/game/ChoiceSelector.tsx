import { motion } from 'framer-motion';
import { CHOICE, CHOICE_EMOJIS, CHOICE_NAMES, type Choice } from '@/config/constants';

interface ChoiceSelectorProps {
  onSelect: (choice: Choice) => void;
  selectedChoice?: Choice | null;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-16 h-16 text-2xl',
  md: 'w-24 h-24 text-4xl',
  lg: 'w-32 h-32 text-5xl',
};

export function ChoiceSelector({
  onSelect,
  selectedChoice,
  disabled = false,
  size = 'md',
}: ChoiceSelectorProps) {
  const choices = [CHOICE.Rock, CHOICE.Paper, CHOICE.Scissors] as const;

  return (
    <div className="flex gap-4 justify-center">
      {choices.map((choice) => (
        <motion.button
          key={choice}
          onClick={() => onSelect(choice)}
          disabled={disabled}
          className={`
            ${sizeClasses[size]}
            rounded-xl flex items-center justify-center
            transition-all duration-200
            bg-gray-800 border-2
            ${
              selectedChoice === choice
                ? 'border-primary-500 bg-primary-900/50 ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-900'
                : 'border-gray-700 hover:border-primary-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}
          `}
          whileHover={disabled ? {} : { scale: 1.1 }}
          whileTap={disabled ? {} : { scale: 0.95 }}
          aria-label={CHOICE_NAMES[choice]}
          title={CHOICE_NAMES[choice]}
        >
          <span role="img" aria-hidden="true">
            {CHOICE_EMOJIS[choice]}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

interface ChoiceDisplayProps {
  choice: Choice | null;
  revealed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ChoiceDisplay({
  choice,
  revealed = true,
  size = 'md',
  className = '',
}: ChoiceDisplayProps) {
  return (
    <motion.div
      className={`
        ${sizeClasses[size]}
        rounded-xl flex items-center justify-center
        bg-gray-800 border-2 border-gray-700
        ${className}
      `}
      initial={{ rotateY: 0 }}
      animate={{ rotateY: revealed ? 0 : 180 }}
      transition={{ duration: 0.3 }}
    >
      <span role="img" aria-hidden="true">
        {revealed && choice ? CHOICE_EMOJIS[choice] : '❓'}
      </span>
    </motion.div>
  );
}
