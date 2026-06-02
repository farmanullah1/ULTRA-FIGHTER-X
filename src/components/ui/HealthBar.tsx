import React from 'react'
import { motion } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface HealthBarProps {
  player: 1 | 2
  health: number
  maxHealth: number
  name: string
  color: string
}

export const HealthBar: React.FC<HealthBarProps> = ({ player, health, maxHealth, name, color }) => {
  const percentage = (health / maxHealth) * 100
  const isP1 = player === 1
  const isLowHealth = percentage <= 30

  // Dual gradient colors for modern premium feel
  const healthGradient = isP1
    ? `linear-gradient(90deg, ${color} 0%, var(--neon-cyan) 100%)`
    : `linear-gradient(-90deg, ${color} 0%, var(--neon-magenta) 100%)`

  return (
    <div className={cn(
      "flex flex-col w-[42%] gap-2 select-none",
      isP1 ? "items-start" : "items-end"
    )}>
      {/* Player Header Info */}
      <div className={cn(
        "flex items-center gap-4 px-2",
        isP1 ? "flex-row" : "flex-row-reverse"
      )}>
        <span className="text-2xl font-display font-black tracking-wider text-white italic drop-shadow-glow uppercase">
          {name}
        </span>
        <span className={cn(
          "text-xs font-mono px-2 py-0.5 rounded border font-semibold",
          isP1 
            ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan" 
            : "border-neon-magenta/40 bg-neon-magenta/10 text-neon-magenta"
        )}>
          {isP1 ? "P1" : "P2"}
        </span>
      </div>

      {/* Main Bar Holder */}
      <div className={cn(
        "relative w-full h-10 bg-dark-900/90 border border-white/20 overflow-hidden shadow-2xl transition-all duration-300",
        isP1 ? "-skew-x-12 origin-top-left" : "skew-x-12 origin-top-right",
        isLowHealth ? "border-neon-red animate-pulse" : "border-white/20"
      )}
      style={{
        boxShadow: isLowHealth ? '0 0 15px rgba(255, 0, 60, 0.4)' : '0 4px 15px rgba(0,0,0,0.5)'
      }}>
        
        {/* Underlayer Grid Line Pattern */}
        <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />

        {/* Slow Drain Catch-up Bar */}
        <motion.div
          className="absolute top-0 bottom-0 bg-neon-red/40"
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          style={{ [isP1 ? 'left' : 'right']: 0 }}
        />

        {/* Dynamic Highlight Flash Layer */}
        <motion.div
          className="absolute top-0 bottom-0 bg-white opacity-40 mix-blend-overlay"
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.05 }}
          style={{ [isP1 ? 'left' : 'right']: 0 }}
        />

        {/* Main Health Gradient Fill */}
        <motion.div
          className="absolute top-0 bottom-0 health-bar-fill"
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.1 }}
          style={{ 
            background: healthGradient,
            [isP1 ? 'left' : 'right']: 0,
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.4), 0 0 20px ${color}55`
          }}
        />

        {/* Grid Segments */}
        <div className="absolute inset-0 flex justify-between pointer-events-none">
          {[20, 40, 60, 80].map(tick => (
            <div key={tick} className="w-[2px] h-full bg-dark-900/40" style={{ left: `${tick}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
