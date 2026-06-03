import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CHARACTERS } from '@constants/characters'
import { useGameStore } from '@stores/gameStore'
import type { CharacterDef, CharacterID } from '@game-types/character.types'
import { audioManager } from '@engine/audio/AudioManager'

export const CharacterSelect: React.FC = () => {
  const { player1CharId, selectCharacter, setScreen, gameMode } = useGameStore()
  const [hoveredChar, setHoveredChar] = useState<CharacterDef>(CHARACTERS[0])
  
  const handleSelect = (id: CharacterID) => {
    selectCharacter(1, id)
    
    // Random select P2
    const otherChars = CHARACTERS.filter(c => c.id !== id)
    const randomP2 = otherChars[Math.floor(Math.random() * otherChars.length)].id
    selectCharacter(2, randomP2)
    
    // Trigger confirm animations in WebGL
    if ((window as any).confirmCSSSelection) {
      (window as any).confirmCSSSelection(1)
      ;(window as any).confirmCSSSelection(2)
    }
    
    setTimeout(() => {
      if (!gameMode || gameMode === 'attract') {
        useGameStore.getState().setGameMode('arcade')
      }
      setScreen('stage-select')
    }, 1200) // 1.2 seconds for confirmation victory poses to play
  }

  const handleReturn = () => {
    audioManager.playSFX('menu_select')
    setScreen('main-menu')
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row items-center justify-between p-6 md:p-16 bg-dark-900/95 backdrop-blur-2xl pointer-events-auto gap-6 md:gap-8 overflow-y-auto select-none">
      
      {/* Left side: Character grid and header */}
      <div className="flex-1 flex flex-col items-start justify-center h-full max-w-3xl w-full">
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="mb-6 md:mb-8"
        >
          <span className="text-neon-cyan text-xs md:text-sm font-mono tracking-[0.4em] font-black uppercase">FIGHTER DIRECTORY</span>
          <h2 className="text-3xl md:text-5xl font-display font-black text-white italic tracking-tighter drop-shadow-[0_0_20px_rgba(0,255,255,0.35)]">
            SELECT YOUR CHAMPION
          </h2>
        </motion.div>

        {/* Grid cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 w-full">
          {CHARACTERS.map((char) => {
            const isSelected = player1CharId === char.id
            return (
              <motion.button
                key={char.id}
                whileHover={{ scale: 1.04, borderColor: char.colors.primary }}
                whileTap={{ scale: 0.96 }}
                onMouseEnter={() => {
                  setHoveredChar(char)
                  useGameStore.getState().setPlayer1HoveredCharId(char.id)
                  // Select a random CPU opponent for P2 preview
                  const otherChars = CHARACTERS.filter(c => c.id !== char.id)
                  const randomP2 = otherChars[Math.floor(Math.random() * otherChars.length)].id
                  useGameStore.getState().setPlayer2HoveredCharId(randomP2)
                  audioManager.playSFX('menu_hover')
                }}
                onClick={() => handleSelect(char.id)}
                className={`relative group h-32 md:h-44 overflow-hidden border transition-all duration-200 clip-corner-both cursor-pointer ${
                  isSelected 
                    ? 'border-neon-cyan bg-neon-cyan/15 shadow-[0_0_15px_rgba(0,255,255,0.25)]' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                {/* Visual design inside card */}
                <div className="absolute inset-0 bg-cyber-grid opacity-10" />

                {/* Left vertical ribbon */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-2 transition-all duration-300 group-hover:w-3"
                  style={{ backgroundColor: char.colors.primary }}
                />

                <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5 z-10 bg-gradient-to-t from-dark-900 via-dark-900/30 to-transparent">
                  <span className="text-[9px] md:text-[10px] font-mono tracking-widest text-white/50 uppercase">
                    {char.archetype}
                  </span>
                  <h3 className="text-xl md:text-2xl font-display font-black italic text-white group-hover:text-neon-cyan transition-colors">
                    {char.name}
                  </h3>
                </div>

                {/* Hover back glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{ backgroundColor: char.colors.primary }}
                />
              </motion.button>
            )
          })}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleReturn}
          onMouseEnter={() => audioManager.playSFX('menu_hover')}
          className="mt-6 md:mt-8 text-white/40 font-mono text-xs tracking-widest hover:text-neon-cyan transition-colors border-b border-transparent hover:border-neon-cyan cursor-pointer uppercase"
        >
          &lt; RETURN TO MAIN MENU
        </motion.button>
      </div>

      {/* Right side: Detailed character dossier */}
      <AnimatePresence mode="wait">
        <motion.div
          key={hoveredChar.id}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 50, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full md:w-[420px] h-[450px] md:h-full flex flex-col bg-white/[0.02] border border-white/10 p-6 md:p-8 rounded-xl backdrop-blur-xl relative overflow-y-auto"
        >
          {/* Cyberpunk corner bracket markings */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-neon-cyan/50" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-neon-cyan/50" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-neon-cyan/50" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-neon-cyan/50" />

          {/* Holographic Header */}
          <div className="space-y-1 mb-4 md:mb-6 border-b border-white/10 pb-4">
            <span className="text-xs font-mono tracking-widest uppercase font-bold" style={{ color: hoveredChar.colors.primary }}>
              {hoveredChar.title}
            </span>
            <h3 className="text-3xl md:text-4xl font-display font-black italic text-white">
              {hoveredChar.name}
            </h3>
            <p className="text-xs md:text-sm text-white/60 font-body leading-relaxed pt-2">
              {hoveredChar.lore}
            </p>
          </div>

          {/* Stats dossier */}
          <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
            <h4 className="text-xs font-mono tracking-[0.2em] text-white/40 uppercase">FIGHTER STATS</h4>
            
            <StatRow label="SPEED" value={hoveredChar.stats.walkSpeed * 5} color={hoveredChar.colors.primary} max={1} />
            <StatRow label="POWER / WEIGHT" value={hoveredChar.stats.weight} color={hoveredChar.colors.primary} max={2.0} />
            <StatRow label="JUMP HEIGHT" value={hoveredChar.stats.jumpHeight} color={hoveredChar.colors.primary} max={0.6} />
            <StatRow label="DIFFICULTY" value={hoveredChar.difficulty} color={hoveredChar.colors.primary} max={3} isStars />
          </div>

          {/* Movesets teaser */}
          <div className="space-y-2 md:space-y-3 flex-1">
            <h4 className="text-xs font-mono tracking-[0.2em] text-white/40 uppercase">SIGNATURE MOVES</h4>
            <div className="flex flex-col gap-2">
              {hoveredChar.moves.filter(m => m.type === 'special' || m.type === 'super').map(move => (
                <div key={move.id} className="flex justify-between items-center bg-white/[0.03] border border-white/5 p-2 md:p-3 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-display font-black text-white italic">{move.name}</span>
                    <span className="text-[9px] md:text-[10px] font-mono text-white/40 uppercase">{move.type}</span>
                  </div>
                  <span className="text-[10px] md:text-xs font-mono px-2 md:px-3 py-1 bg-black/40 border border-white/10 text-neon-cyan rounded">
                    {move.input}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

interface StatRowProps {
  label: string
  value: number
  color: string
  max: number
  isStars?: boolean
}

const StatRow: React.FC<StatRowProps> = ({ label, value, color, max, isStars }) => {
  const percent = Math.min(100, (value / max) * 100)
  
  return (
    <div className="flex flex-col gap-1 w-full text-xs font-mono">
      <div className="flex justify-between text-white/70">
        <span>{label}</span>
        <span>{isStars ? `${value}/3` : `${Math.round(percent)}%`}</span>
      </div>
      {isStars ? (
        <div className="flex gap-1.5">
          {[1, 2, 3].map(star => (
            <div 
              key={star} 
              className={`h-2 flex-1 rounded-sm border ${
                star <= value 
                  ? 'border-white/20' 
                  : 'border-white/5 bg-transparent'
              }`}
              style={{ backgroundColor: star <= value ? color : 'transparent' }}
            />
          ))}
        </div>
      ) : (
        <div className="w-full h-2 bg-black/35 rounded-sm overflow-hidden border border-white/5">
          <motion.div 
            className="h-full rounded-sm"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.3 }}
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}aa` }}
          />
        </div>
      )}
    </div>
  )
}
