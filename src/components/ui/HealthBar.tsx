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

  return (
    <div className={cn(
      "flex flex-col w-[45%] gap-1",
      isP1 ? "items-start" : "items-end"
    )}>
      <div className="flex items-center gap-3 w-full">
        {isP1 && <div className="text-xl font-display text-white italic">{name}</div>}
        <div className="relative flex-1 h-8 bg-dark-900/80 border border-white/20 clip-corner-both">
          {/* Drain Bar */}
          <motion.div
            className="absolute top-0 bottom-0 bg-neon-red/50"
            initial={{ width: '100%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            style={{ [isP1 ? 'left' : 'right']: 0 }}
          />
          {/* Main Bar */}
          <motion.div
            className="absolute top-0 bottom-0 health-bar-fill"
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.1 }}
            style={{ 
              backgroundColor: color,
              [isP1 ? 'left' : 'right']: 0,
              boxShadow: `0 0 20px ${color}66`
            }}
          />
          {/* Grid Segments */}
          <div className="absolute inset-0 flex justify-between pointer-events-none">
            {[25, 50, 75].map(tick => (
              <div key={tick} className="w-[1px] h-full bg-white/10" style={{ left: `${tick}%` }} />
            ))}
          </div>
        </div>
        {!isP1 && <div className="text-xl font-display text-white italic">{name}</div>}
      </div>
    </div>
  )
}
