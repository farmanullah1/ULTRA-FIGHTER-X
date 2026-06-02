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

  // Segment colors based on charge level
  const fillGradient = isFull
    ? `linear-gradient(90deg, var(--neon-yellow) 0%, #FF9900 100%)`
    : `linear-gradient(${isP1 ? '90deg' : '-90deg'}, ${color} 0%, #00FFFF 100%)`

  return (
    <div className={cn(
      "flex flex-col w-[35%] gap-1 mt-1 select-none",
      isP1 ? "items-start" : "items-end"
    )}>
      {/* Sleek container */}
      <div className={cn(
        "relative w-full h-5 bg-dark-900/90 border overflow-hidden shadow-lg",
        isP1 ? "-skew-x-12" : "skew-x-12",
        isFull ? "border-neon-yellow animate-flicker" : "border-white/10"
      )}>
        
        {/* Glow for full meter */}
        {isFull && (
          <div className="absolute inset-0 bg-neon-yellow/20 animate-pulse" />
        )}

        {/* Filling Bar */}
        <motion.div
          className="absolute top-0 bottom-0"
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.15 }}
          style={{ 
            background: fillGradient,
            [isP1 ? 'left' : 'right']: 0,
            boxShadow: isFull ? '0 0 15px var(--neon-yellow)' : `0 0 8px ${color}66`
          }}
        />

        {/* Segment dividers */}
        <div className="absolute inset-0 flex justify-evenly pointer-events-none">
          <div className="w-[1.5px] h-full bg-dark-900/60" />
          <div className="w-[1.5px] h-full bg-dark-900/60" />
        </div>

        {/* Dynamic Badge label */}
        <div className={cn(
          "absolute inset-y-0 px-2 flex items-center text-[9px] font-display font-black tracking-widest z-10",
          isP1 ? "left-0" : "right-0",
          isFull ? "text-dark-900" : "text-white/60"
        )}>
          {isFull ? "MAX OVERDRIVE" : "SPECIAL BAR"}
        </div>
      </div>
    </div>
  )
}
