import React from 'react'
import { motion } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface MeterBarProps {
  player: 1 | 2
  meter: number
  maxMeter: number
  color: string
}

export const MeterBar: React.FC<MeterBarProps> = ({ player, meter, maxMeter, color }) => {
  const percentage = (meter / maxMeter) * 100
  const isP1 = player === 1
  const isFull = meter >= maxMeter

  return (
    <div className={cn(
      "flex flex-col w-[35%] gap-1 mt-2",
      isP1 ? "items-start" : "items-end"
    )}>
      <div className="relative w-full h-4 bg-dark-900/60 border border-white/10 clip-corner-both overflow-hidden">
        {/* Fill */}
        <motion.div
          className={cn(
            "absolute top-0 bottom-0 transition-colors duration-300",
            isFull ? "animate-pulse" : ""
          )}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.2 }}
          style={{ 
            backgroundColor: isFull ? 'var(--neon-yellow)' : color,
            [isP1 ? 'left' : 'right']: 0,
            boxShadow: isFull ? `0 0 15px var(--neon-yellow)` : `0 0 10px ${color}66`
          }}
        />
        
        {/* Label */}
        <div className={cn(
          "absolute inset-y-0 px-2 flex items-center text-[10px] font-black italic tracking-tighter z-10",
          isP1 ? "left-0" : "right-0",
          isFull ? "text-dark-900" : "text-white/40"
        )}>
          {isFull ? "MAX POWER" : "EX DRIVE"}
        </div>
      </div>
    </div>
  )
}
