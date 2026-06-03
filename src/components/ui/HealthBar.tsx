import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface StatusProps {
  status: {
    isBlocking: boolean
    isInHitstun: boolean
    isOverdriveActive: boolean
    isPoisoned: boolean
  }
  player: 1 | 2
}

const StatusEffects: React.FC<StatusProps> = ({ status, player }) => {
  const isP1 = player === 1
  return (
    <div className={cn(
      "absolute -top-7 flex items-center gap-1.5 z-10",
      isP1 ? "left-2" : "right-2"
    )}>
      <AnimatePresence>
        {/* Poison */}
        {status.isPoisoned && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.6, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-neon-green bg-neon-green/10 text-[9px] font-mono font-black text-neon-green shadow-[0_0_8px_rgba(57,255,20,0.4)] animate-pulse"
          >
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 100 100">
              <path d="M35 15H65V25H55V45L80 75V85H20V75L45 45V25H35V15ZM50 50L30 75H70L50 50Z" />
            </svg>
            TOXIC
          </motion.div>
        )}

        {/* Stun */}
        {status.isInHitstun && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.6, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-neon-yellow bg-neon-yellow/10 text-[9px] font-mono font-black text-neon-yellow shadow-[0_0_8px_rgba(255,230,0,0.4)]"
          >
            <svg className="w-2.5 h-2.5 fill-current animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 100 100">
              <path d="M50 10L62 38L92 42L68 62L76 92L50 76L24 92L32 62L8 42L38 38L50 10Z" />
            </svg>
            STUN
          </motion.div>
        )}

        {/* Rage / Overdrive */}
        {status.isOverdriveActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.6, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-neon-red bg-neon-red/10 text-[9px] font-mono font-black text-neon-red shadow-[0_0_8px_rgba(255,0,60,0.4)]"
          >
            <svg className="w-2.5 h-2.5 fill-current animate-bounce" viewBox="0 0 100 100">
              <path d="M50 10C50 10 70 35 70 55C70 66 61 75 50 75C39 75 30 66 30 55C30 35 50 10 50 10Z" />
            </svg>
            RAGE
          </motion.div>
        )}

        {/* Armor / Blocking */}
        {status.isBlocking && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.6, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-neon-cyan bg-neon-cyan/10 text-[9px] font-mono font-black text-neon-cyan shadow-[0_0_8px_rgba(0,255,255,0.4)]"
          >
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 100 100">
              <path d="M50 15L80 25V55C80 72 67 85 50 90C33 85 20 72 20 55V25L50 15Z" />
            </svg>
            GUARD
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface HealthBarProps {
  player: 1 | 2
  health: number
  maxHealth: number
  name: string
  color: string
  charId: string
  status: {
    isBlocking: boolean
    isInHitstun: boolean
    isOverdriveActive: boolean
    isPoisoned: boolean
  }
}

export const HealthBar: React.FC<HealthBarProps> = ({ 
  player, health, maxHealth, name, color, charId, status 
}) => {
  const percentage = (health / maxHealth) * 100
  const isP1 = player === 1
  const isLowHealth = percentage <= 30

  const getHealthColor = () => {
    if (percentage > 50) return color
    if (percentage >= 25) return '#FFAA00' // Yellow/Orange
    return '#FF003C' // Red
  }
  const activeColor = getHealthColor()

  // Dual gradient colors for modern premium feel
  const healthGradient = isP1
    ? `linear-gradient(90deg, ${activeColor} 0%, var(--neon-cyan) 100%)`
    : `linear-gradient(-90deg, ${activeColor} 0%, var(--neon-magenta) 100%)`

  // Get color overlay filters to represent alternate colors/costumes (P1 colorIndex is read from HUD or default to 0)
  // We can inject a subtle hue rotation on P2 for color difference if it's a mirror match
  const getPortraitFilter = () => {
    let filterStr = ''
    if (status.isInHitstun) {
      filterStr += 'hue-rotate(330deg) saturate(3.5) sepia(0.6) brightness(1.2) '
    } else if (isLowHealth) {
      filterStr += 'grayscale(0.35) sepia(0.1) '
    }
    return filterStr || 'none'
  }

  return (
    <div className={cn(
      "flex items-center gap-3 w-[45%] select-none pointer-events-none",
      isP1 ? "flex-row" : "flex-row-reverse"
    )}>
      {/* Skewed Character Face Portrait Container */}
      <div className={cn(
        "w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-lg p-0.5 border border-white/20 bg-dark-900/60 shadow-2xl relative overflow-hidden transition-all duration-300",
        isP1 ? "-skew-x-12" : "skew-x-12",
        status.isPoisoned && "border-neon-green shadow-[0_0_10px_rgba(57,255,20,0.5)]",
        status.isInHitstun && "border-neon-red shadow-[0_0_10px_rgba(255,0,0,0.65)]",
        status.isOverdriveActive && "border-neon-red shadow-[0_0_10px_rgba(255,0,60,0.5)]",
        status.isBlocking && "border-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)]"
      )}>
        <div className={cn(isP1 ? "skew-x-12" : "-skew-x-12", "w-full h-full relative overflow-hidden flex items-center justify-center")}>
          <motion.img 
            src={`${import.meta.env.BASE_URL}assets/images/characters/${charId.replace(/-/g, '_')}.png`}
            alt={charId}
            className="w-[125%] h-[125%] object-cover object-top select-none pointer-events-none"
            style={{
              filter: getPortraitFilter(),
              transform: isP1 ? 'scaleX(1)' : 'scaleX(-1)' // P2 faces P1
            }}
            animate={status.isInHitstun ? {
              x: [0, -3, 3, -3, 3, 0],
              y: [0, 2, -2, 2, -2, 0]
            } : {}}
            transition={{ duration: 0.15, repeat: status.isInHitstun ? Infinity : 0 }}
          />
          {/* Crimson flash screen overlay on hit */}
          {status.isInHitstun && (
            <div className="absolute inset-0 bg-red-600/40 mix-blend-color-dodge animate-pulse" />
          )}
        </div>
      </div>

      {/* Main Bar + Header Block */}
      <div className={cn(
        "flex flex-col flex-grow gap-1 relative",
        isP1 ? "items-start" : "items-end"
      )}>
        {/* Status Indicators overlay */}
        <StatusEffects status={status} player={player} />

        {/* Player Header Info */}
        <div className={cn(
          "flex items-center gap-3 px-1",
          isP1 ? "flex-row" : "flex-row-reverse"
        )}>
          <span className="text-xl md:text-2xl font-display font-black tracking-wider text-white italic drop-shadow-glow uppercase">
            {name}
          </span>
          <span className={cn(
            "text-[9px] md:text-xs font-mono px-1.5 py-0.5 rounded border font-semibold",
            isP1 
              ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan" 
              : "border-neon-magenta/40 bg-neon-magenta/10 text-neon-magenta"
          )}>
            {isP1 ? "P1" : "P2"}
          </span>
        </div>

        {/* Main Bar Holder */}
        <div className={cn(
          "relative w-full h-8 md:h-10 bg-dark-900/90 border overflow-hidden shadow-2xl transition-all duration-300",
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
              boxShadow: `inset 0 2px 4px rgba(255,255,255,0.4), 0 0 20px ${activeColor}55`
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
    </div>
  )
}
