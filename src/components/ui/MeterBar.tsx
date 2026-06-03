import React from 'react'
import { motion } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MeterChargeEmblem: React.FC<{ 
  charId: string; className?: string; isFull: boolean; percentage: number 
}> = ({ charId, className, isFull, percentage }) => {
  const opacity = 0.3 + (percentage / 100) * 0.7
  const scale = 0.8 + (percentage / 100) * 0.2
  
  switch (charId) {
    case 'kai-storm':
      return (
        <svg 
          className={className} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity, transform: `scale(${scale})`, transition: 'all 0.15s ease-out' }}
        >
          <path d="M55 10L25 55H48L35 90L75 42H50L55 10Z" fill={isFull ? '#FFE600' : '#00FFFF'} filter={isFull ? 'drop-shadow(0 0 6px #FFD700)' : 'none'} />
        </svg>
      )
    case 'viper-x':
      return (
        <svg 
          className={className} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity, transform: `scale(${scale})`, transition: 'all 0.15s ease-out' }}
        >
          <path d="M50 15C35 45 25 60 25 70C25 82 36 90 50 90C64 90 75 82 75 70C75 60 65 45 50 15Z" fill={isFull ? '#FFE600' : '#39FF14'} filter={isFull ? 'drop-shadow(0 0 6px #FFD700)' : 'none'} />
        </svg>
      )
    case 'iron-claw':
      return (
        <svg 
          className={className} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity, transform: `scale(${scale})`, transition: 'all 0.15s ease-out' }}
        >
          <circle cx="50" cy="50" r="28" stroke={isFull ? '#FFE600' : '#FF6600'} strokeWidth="8" strokeDasharray="10 5" className={isFull ? "animate-spin" : ""} style={{ transformOrigin: 'center', animationDuration: '8s' }} />
          <circle cx="50" cy="50" r="10" fill={isFull ? '#FFE600' : '#FF6600'} />
        </svg>
      )
    case 'nova-star':
      return (
        <svg 
          className={className} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity, transform: `scale(${scale})`, transition: 'all 0.15s ease-out' }}
        >
          <path d="M50 10L55 40L85 45L55 50L50 80L45 50L15 45L45 40L50 10Z" fill={isFull ? '#FFE600' : '#FF00FF'} filter={isFull ? 'drop-shadow(0 0 6px #FFD700)' : 'none'} />
        </svg>
      )
    case 'shadow-byte':
      return (
        <svg 
          className={className} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity, transform: `scale(${scale})`, transition: 'all 0.15s ease-out' }}
        >
          <rect x="25" y="25" width="50" height="50" stroke={isFull ? '#FFE600' : '#7700FF'} strokeWidth="6" />
          <rect x="40" y="40" width="20" height="20" fill={isFull ? '#FFE600' : '#00FFFF'} className={isFull ? "animate-pulse" : ""} />
        </svg>
      )
    case 'phoenix-rise':
      return (
        <svg 
          className={className} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity, transform: `scale(${scale})`, transition: 'all 0.15s ease-out' }}
        >
          <path d="M50 12C50 12 70 38 70 58C70 69 61 78 50 78C39 78 30 69 30 58C30 38 50 12 50 12Z" fill={isFull ? '#FFE600' : '#FF003C'} filter={isFull ? 'drop-shadow(0 0 6px #FFD700)' : 'none'} />
        </svg>
      )
    default:
      return null
  }
}

interface MeterBarProps {
  player: 1 | 2
  meter: number
  maxMeter: number
  color: string
  charId: string
}

export const MeterBar: React.FC<MeterBarProps> = ({ player, meter, maxMeter, color, charId }) => {
  const percentage = (meter / maxMeter) * 100
  const isP1 = player === 1
  const isFull = meter >= maxMeter

  // Segment colors based on charge level
  const fillGradient = isFull
    ? `linear-gradient(90deg, var(--neon-yellow) 0%, #FF9900 100%)`
    : `linear-gradient(${isP1 ? '90deg' : '-90deg'}, ${color} 0%, #00FFFF 100%)`

  return (
    <div className={cn(
      "flex items-center gap-2 w-[38%] mt-1 select-none pointer-events-none",
      isP1 ? "flex-row" : "flex-row-reverse"
    )}>
      {/* Character Meter Charge Emblem */}
      <div className="w-6 h-6 shrink-0 flex items-center justify-center">
        <MeterChargeEmblem charId={charId} className="w-full h-full" isFull={isFull} percentage={percentage} />
      </div>

      {/* Sleek container */}
      <div className={cn(
        "relative flex-grow h-5 bg-dark-900/90 border overflow-hidden shadow-lg",
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
          "absolute inset-y-0 px-2 flex items-center text-[8px] md:text-[9px] font-display font-black tracking-widest z-10",
          isP1 ? "left-0" : "right-0",
          isFull ? "text-dark-900" : "text-white/60"
        )}>
          {isFull ? "MAX OVERDRIVE" : "SPECIAL BAR"}
        </div>
      </div>
    </div>
  )
}
