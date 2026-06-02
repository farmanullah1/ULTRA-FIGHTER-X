import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface RoundTimerProps {
  time: number
}

export const RoundTimer: React.FC<RoundTimerProps> = ({ time }) => {
  const isWarning = time <= 10
  const displayTime = Math.max(0, time).toString().padStart(2, '0')

  return (
    <div className="flex flex-col items-center justify-center w-24 h-24 cyber-panel clip-corner-both">
      <AnimatePresence mode="wait">
        <motion.div
          key={displayTime}
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`text-4xl font-display font-black ${isWarning ? 'text-neon-red animate-pulse' : 'text-neon-cyan'}`}
          style={{ textShadow: `0 0 10px ${isWarning ? 'var(--neon-red)' : 'var(--neon-cyan)'}` }}
        >
          {displayTime}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
