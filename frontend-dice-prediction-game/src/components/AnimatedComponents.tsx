"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';

// Floating Dice Animation Component
export const FloatingDice = () => {
  return (
    <motion.div
      className="inline-block"
      animate={{
        y: [0, -10, 0],
        rotateY: [0, 360],
      }}
      transition={{
        y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
      }}
    >
      <div className="text-6xl">🎲</div>
    </motion.div>
  );
};

// Animated Button Component
export const AnimatedButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  className = '',
  ...props 
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  className?: string;
  [key: string]: unknown;
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
    warning: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 text-white font-semibold rounded-xl shadow-lg transition-all
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      whileHover={!disabled ? { 
        scale: 1.05, 
        y: -2,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Animated Card Component
export const AnimatedCard = ({ 
  children, 
  className = '',
  delay = 0,
  ...props 
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  [key: string]: unknown;
}) => {
  return (
    <motion.div
      className={`bg-blue-900/30 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-blue-300/20 ${className}`}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', color = 'purple' }: { 
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'blue' | 'green' | 'yellow';
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const colors = {
    purple: 'border-purple-600',
    blue: 'border-blue-600',
    green: 'border-green-600',
    yellow: 'border-yellow-600',
  };

  return (
    <motion.div
      className={`inline-block rounded-full border-2 border-t-transparent ${sizes[size]} ${colors[color]}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
};

// Notification Toast Component
export const NotificationToast = ({ 
  message, 
  type, 
  onClose 
}: { 
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}) => {
  const variants = {
    success: 'bg-green-900/30 backdrop-blur-md border-green-400/30 text-green-200',
    error: 'bg-red-900/30 backdrop-blur-md border-red-400/30 text-red-200',
    warning: 'bg-yellow-900/30 backdrop-blur-md border-yellow-400/30 text-yellow-200',
    info: 'bg-blue-900/30 backdrop-blur-md border-blue-400/30 text-blue-200',
  };

  return (
    <motion.div
      className={`p-6 rounded-xl shadow-lg border ${variants[type]}`}
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{message}</span>
        <motion.button
          onClick={onClose}
          className="text-white/70 hover:text-white ml-4"
          whileHover={{ scale: 1.2, rotate: 90 }}
          whileTap={{ scale: 0.8 }}
        >
          ✕
        </motion.button>
      </div>
    </motion.div>
  );
};

// Confetti Animation Component
export const ConfettiAnimation = () => {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => i);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b'][piece % 6],
            left: `${Math.random() * 100}%`,
            top: '-10px'
          }}
          initial={{ y: -10, rotate: 0 }}
          animate={{ 
            y: typeof window !== 'undefined' ? window.innerHeight + 100 : 800,
            rotate: 360,
            x: [0, Math.random() * 200 - 100, Math.random() * 200 - 100]
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            ease: "easeInOut",
            delay: Math.random() * 2
          }}
        />
      ))}
    </div>
  );
};

// Emoji Rain Animation Component
export const EmojiRain = ({ 
  emoji, 
  duration = 3500,
  onComplete 
}: {
  emoji: string;
  duration?: number;
  onComplete?: () => void;
}) => {
  const emojiPieces = Array.from({ length: 30 }, (_, i) => i);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onComplete]);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {emojiPieces.map((piece) => (
        <motion.div
          key={piece}
          className="absolute text-6xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-80px'
          }}
          initial={{ y: -80, rotate: 0, opacity: 1 }}
          animate={{ 
            y: typeof window !== 'undefined' ? window.innerHeight + 120 : 920,
            rotate: 360,
            opacity: [1, 1, 0.9, 0.7, 0]
          }}
          transition={{
            duration: duration / 1000,
            ease: "easeOut",
            delay: Math.random() * 0.8
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
};

// Animated Number Counter
export const AnimatedCounter = ({ 
  value, 
  className = ''
}: {
  value: number;
  duration?: number;
  className?: string;
}) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      key={value}
    >
      <motion.span
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6 }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
};

// Dice Roll Animation Component
export const DiceRollAnimation = ({ 
  isRolling, 
  currentFrame, 
  finalResult,
  selectedNumber,
  size = 120
}: { 
  isRolling: boolean;
  currentFrame: number;
  finalResult?: number;
  selectedNumber?: number;
  size?: number;
}) => {
  const diceImage = isRolling 
    ? `/Rolling-Dices/Rolling${currentFrame}.png`
    : `/Static-Dices/Static${finalResult || selectedNumber || 1}.png`;

  return (
    <motion.div
      className="flex justify-center"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ 
        scale: 1, 
        rotate: 0,
        y: isRolling ? [-20, 0, -20] : 0
      }}
      transition={{ 
        scale: { duration: 0.6, ease: "backOut" },
        rotate: { duration: 0.6, ease: "backOut" },
        y: isRolling ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }
      }}
    >
      <motion.div
        animate={{ 
          rotateX: isRolling ? [0, 360] : 0,
          rotateY: isRolling ? [0, 360] : 0
        }}
        transition={{ 
          duration: isRolling ? 0.3 : 0,
          repeat: isRolling ? Infinity : 0,
          ease: "linear"
        }}
        className="relative"
        key={!isRolling ? (finalResult || selectedNumber) : 'rolling'} // Add key to trigger re-render when number changes
      >
        <motion.div
          initial={!isRolling && !finalResult ? { scale: 0.8, opacity: 0 } : false}
          animate={!isRolling && !finalResult ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.3, ease: "backOut" }}
        >
          <Image
            src={diceImage}
            alt={`Dice showing ${isRolling ? 'rolling' : finalResult || selectedNumber || 1}`}
            width={size}
            height={size}
            className="drop-shadow-2xl"
            priority
          />
        </motion.div>
        {isRolling && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-400/20 to-purple-600/20"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

// Animated Link Component
export const AnimatedLink = ({ 
  children, 
  href,
  variant = 'primary',
  size = 'medium',
  className = '',
  ...props 
}: {
  children: React.ReactNode;
  href: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  [key: string]: unknown;
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
    warning: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700',
  };

  const sizes = {
    small: 'px-6 py-3 text-sm',
    medium: 'px-8 py-4 text-base',
    large: 'px-10 py-5 text-lg',
  };

  return (
    <Link href={href} {...props}>
      <motion.div
        className={`
          inline-flex items-center text-white font-semibold rounded-xl shadow-lg transition-all cursor-pointer
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
        whileHover={{ 
          scale: 1.05, 
          y: -2,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {children}
      </motion.div>
    </Link>
  );
};
