import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@stores/gameStore'
import { CHARACTERS } from '@constants/characters'
import type { CharacterDef } from '@game-types/character.types'
import { audioManager } from '@engine/audio/AudioManager'

export const VsScreen: React.FC = () => {
  const { player1CharId, player2CharId, player1ColorIndex, player2ColorIndex, setScreen } = useGameStore()

  const p1 = CHARACTERS.find((c: CharacterDef) => c.id === player1CharId) || CHARACTERS[0]
  const p2 = CHARACTERS.find((c: CharacterDef) => c.id === player2CharId) || CHARACTERS[1]

  // Play VS chime on mount, and transition to battle after 3.5 seconds
  useEffect(() => {
    audioManager.playSFX('super_chime', 1.0)
    audioManager.playSFX('voice_shout', 0.8)
    audioManager.announce(`${p1.name} versus ${p2.name}`)

    const timer = setTimeout(() => {
      setScreen('battle')
    }, 3800)

    return () => clearTimeout(timer)
  }, [setScreen, p1.name, p2.name])

  // Get color overlay filters to represent alternate colors/costumes
  const getFilter = (colorIndex: number) => {
    switch (colorIndex) {
      case 1:
        return 'hue-rotate(90deg) saturate(1.2)'
      case 2:
        return 'hue-rotate(180deg) brightness(1.1)'
      case 3:
        return 'hue-rotate(270deg) contrast(1.2)'
      default:
        return 'none'
    }
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-between select-none pointer-events-auto">
      {/* Background cyber grid */}
      <div className="absolute inset-0 bg-cyber-grid opacity-15 z-0" />
      <div className="absolute inset-0 bg-radial-vignette opacity-70 z-0 pointer-events-none" style={{
        background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.85) 100%)'
      }} />

      {/* Sparks overlay loop */}
      <div className="absolute inset-0 z-10 pointer-events-none mix-blend-screen opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-[radial-gradient(circle,rgba(0,255,255,0.15)_0%,transparent_70%)] animate-pulse" />
      </div>

      {/* Left Player Side */}
      <div className="w-1/2 h-full flex flex-col justify-end items-start relative z-10 p-12 md:p-20 overflow-hidden">
        {/* Slanted colored backing */}
        <motion.div 
          initial={{ x: -800, skewX: -20 }}
          animate={{ x: -100, skewX: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute inset-y-0 -left-64 w-[110%] z-0 border-r-8 border-white/25 shadow-2xl opacity-80"
          style={{
            background: `linear-gradient(135deg, ${p1.colors.primary}99 0%, #000000 100%)`,
          }}
        />

        {/* Character image */}
        <motion.div 
          initial={{ x: -200, opacity: 0, scale: 1.15 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, type: 'spring' }}
          className="relative z-10 flex-grow flex items-center justify-start w-full drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
        >
          <img 
            src={`${import.meta.env.BASE_URL}assets/images/characters/${p1.id.replace(/-/g, '_')}.png`} 
            alt={p1.name} 
            className="h-[60%] md:h-[80%] object-contain select-none pointer-events-none rounded-b-xl"
            style={{ 
              filter: getFilter(player1ColorIndex),
              transform: 'scaleX(1)'
            }}
          />
        </motion.div>

        {/* Name details */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="relative z-20 flex flex-col items-start -skew-x-12 mt-4"
        >
          <span className="text-sm font-mono tracking-widest text-neon-cyan uppercase font-bold bg-black/60 px-3 py-1 border-l-2 border-neon-cyan">
            {p1.title}
          </span>
          <h2 className="text-5xl md:text-7xl font-display font-black text-white italic tracking-tighter drop-shadow-glow uppercase mt-1">
            {p1.name}
          </h2>
        </motion.div>
      </div>

      {/* Central VS Breakout */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-44 z-20 flex flex-col items-center justify-center pointer-events-none">
        <motion.div 
          initial={{ scale: 3, opacity: 0 }}
          animate={{ scale: [3, 0.95, 1.05, 1] }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-black flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.35)] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-neon-red via-dark-900 to-neon-cyan animate-pulse opacity-50" />
          <span className="text-4xl md:text-6xl font-display font-black italic tracking-widest text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] z-10">VS</span>
        </motion.div>

        {/* Dynamic lightning/spark bolt drawing */}
        <motion.svg 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: '70%', opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="w-12 text-white fill-current mt-4 mix-blend-screen" 
          viewBox="0 0 100 800"
        >
          <path d="M50 0L35 300H65L30 550H60L50 800L55 520H25L55 270H30L50 0Z" className="animate-pulse" />
        </motion.svg>
      </div>

      {/* Right Player Side */}
      <div className="w-1/2 h-full flex flex-col justify-end items-end relative z-10 p-12 md:p-20 overflow-hidden">
        {/* Slanted colored backing */}
        <motion.div 
          initial={{ x: 800, skewX: -20 }}
          animate={{ x: 100, skewX: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute inset-y-0 -right-64 w-[110%] z-0 border-l-8 border-white/25 shadow-2xl opacity-80"
          style={{
            background: `linear-gradient(135deg, #000000 0%, ${p2.colors.primary}99 100%)`,
          }}
        />

        {/* Character image */}
        <motion.div 
          initial={{ x: 200, opacity: 0, scale: 1.15 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, type: 'spring' }}
          className="relative z-10 flex-grow flex items-center justify-end w-full drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
        >
          <img 
            src={`${import.meta.env.BASE_URL}assets/images/characters/${p2.id.replace(/-/g, '_')}.png`} 
            alt={p2.name} 
            className="h-[60%] md:h-[80%] object-contain select-none pointer-events-none rounded-b-xl"
            style={{ 
              filter: getFilter(player2ColorIndex),
              transform: 'scaleX(-1)' // Face left
            }}
          />
        </motion.div>

        {/* Name details */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="relative z-20 flex flex-col items-end skew-x-12 mt-4"
        >
          <span className="text-sm font-mono tracking-widest text-neon-magenta uppercase font-bold bg-black/60 px-3 py-1 border-r-2 border-neon-magenta">
            {p2.title}
          </span>
          <h2 className="text-5xl md:text-7xl font-display font-black text-white italic tracking-tighter drop-shadow-glow uppercase mt-1">
            {p2.name}
          </h2>
        </motion.div>
      </div>

      {/* Direct Skip Button */}
      <button 
        onClick={() => setScreen('battle')}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/50 text-white font-mono text-[10px] tracking-[0.2em] px-5 py-2 rounded-lg cursor-pointer transition-colors z-30"
      >
        SKIP INTRO
      </button>
    </div>
  )
}
