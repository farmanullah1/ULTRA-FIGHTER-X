import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface RoundTimerProps {
  time: number
}

export const RoundTimer: React.FC<RoundTimerProps> = ({ time }) => {
  const isWarning = time <= 10
  const displayTime = Math.max(0, time).toString().padStart(2, '0')

  return (
    <div className="flex flex-col items-center justify-center w-24 h-24 relative select-none">
      {/* Outer Glow Shield */}
      <div className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
        isWarning 
          ? 'border-neon-red shadow-neon-red bg-neon-red/10 animate-ping scale-95' 
          : 'border-neon-cyan/40 bg-dark-900/90'
      }`} />
      
      {/* Inner Frame */}
      <div className={`absolute inset-1.5 rounded-full border border-white/15 flex items-center justify-center ${
        isWarning ? 'bg-neon-red/5' : 'bg-transparent'
      }`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={displayTime}
            initial={{ opacity: 0, scale: 1.2, rotateX: -90 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateX: 90 }}
            transition={{ duration: 0.15 }}
            className={`text-4xl font-display font-black tracking-tight ${
              isWarning ? 'text-neon-red animate-pulse' : 'text-neon-cyan'
            }`}
            style={{ 
              textShadow: isWarning 
                ? '0 0 15px var(--neon-red)' 
                : '0 0 15px var(--neon-cyan)' 
            }}
          >
            {displayTime}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Small label decoration */}
      <div className="absolute -bottom-2 text-[9px] font-mono text-white/40 tracking-[0.2em]">
        TIME
      </div>
    </div>
  )
}
