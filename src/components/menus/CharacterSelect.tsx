import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CHARACTERS } from '@constants/characters'
import { useGameStore } from '@stores/gameStore'
import type { CharacterDef, CharacterID } from '@game-types/character.types'
import { audioManager } from '@engine/audio/AudioManager'

export const CharacterSelect: React.FC = () => {
  const { 
    player1CharId, selectCharacter, setScreen, gameMode,
    player1ColorIndex, selectColor 
  } = useGameStore()
  const [hoveredChar, setHoveredChar] = useState<CharacterDef>(CHARACTERS[0])

  useEffect(() => {
    audioManager.announce("Select your champion")
  }, [])
  
  const handleSelect = (id: CharacterID) => {
    selectCharacter(1, id)
    
    // Random select P2
    const otherChars = CHARACTERS.filter(c => c.id !== id)
    const randomP2 = otherChars[Math.floor(Math.random() * otherChars.length)].id
    selectCharacter(2, randomP2)
    
    // Select a color index for P2 (alternate from P1 if same char)
    const p2Color = randomP2 === id ? (player1ColorIndex + 1) % 4 : 0
    useGameStore.getState().selectColor(2, p2Color)
    
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

  const getRecord = (id: string) => {
    switch (id) {
      case 'kai-storm': return '142W - 88L (61% WR)'
      case 'viper-x': return '120W - 95L (55% WR)'
      case 'iron-claw': return '98W - 110L (47% WR)'
      case 'nova-star': return '134W - 76L (63% WR)'
      case 'shadow-byte': return '112W - 118L (48% WR)'
      case 'phoenix-rise': return '156W - 64L (70% WR)'
      default: return '0W - 0L (0% WR)'
    }
  }

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
    <div className="w-full h-full flex flex-col md:flex-row items-center justify-between p-6 md:p-16 bg-gradient-to-r from-dark-900/90 via-dark-900/60 to-transparent backdrop-blur-md pointer-events-auto gap-6 md:gap-8 overflow-y-auto select-none">
      
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
                  if (hoveredChar.id !== char.id) {
                    audioManager.announce(char.name)
                  }
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
                <div className="absolute inset-0 bg-cyber-grid opacity-10 z-0" />

                {/* Character portrait thumbnail */}
                <img 
                  src={`${import.meta.env.BASE_URL}assets/images/characters/${char.id.replace(/-/g, '_')}.png`} 
                  alt={char.name}
                  className="absolute right-0 bottom-0 h-[85%] object-contain opacity-40 group-hover:opacity-80 group-hover:scale-105 transition-all duration-300 pointer-events-none z-0"
                />

                {/* Left vertical ribbon */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-2 transition-all duration-300 group-hover:w-3 z-10"
                  style={{ backgroundColor: char.colors.primary }}
                />

                <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5 z-10 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent">
                  <span className="text-[9px] md:text-[10px] font-mono tracking-widest text-white/60 uppercase">
                    {char.archetype}
                  </span>
                  <h3 className="text-xl md:text-2xl font-display font-black italic text-white group-hover:text-neon-cyan transition-colors">
                    {char.name}
                  </h3>
                </div>

                {/* Hover back glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-0"
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
          className="w-full md:w-[420px] h-[550px] md:h-full flex flex-col bg-white/[0.02] border border-white/10 p-6 md:p-8 rounded-xl backdrop-blur-xl relative overflow-y-auto"
        >
          {/* Cyberpunk corner bracket markings */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-neon-cyan/50" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-neon-cyan/50" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-neon-cyan/50" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-neon-cyan/50" />

          {/* Large character 2D render portrait */}
          <div className="w-full h-44 rounded-lg bg-black/45 overflow-hidden border border-white/10 mb-4 relative flex items-center justify-center">
            <img 
              src={`${import.meta.env.BASE_URL}assets/images/characters/${hoveredChar.id.replace(/-/g, '_')}.png`} 
              alt={hoveredChar.name} 
              className="h-full object-contain filter transition-all duration-300"
              style={{ filter: getFilter(player1ColorIndex) }}
            />
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 border border-white/15 rounded text-[10px] font-mono text-white/50">
              {getRecord(hoveredChar.id)}
            </div>
          </div>

          {/* Color Palettes Selection */}
          <div className="flex items-center gap-3 mb-4 bg-black/25 p-2 rounded border border-white/5">
            <span className="text-[10px] font-mono text-white/40 uppercase">COLOR PALETTE:</span>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map(idx => (
                <button
                  key={idx}
                  onClick={() => {
                    selectColor(1, idx)
                    audioManager.playSFX('menu_select')
                  }}
                  className={`w-6 h-6 rounded border transition-all cursor-pointer ${
                    player1ColorIndex === idx 
                      ? 'border-white scale-110 shadow-lg shadow-white/10' 
                      : 'border-white/10 hover:border-white/40'
                  }`}
                  style={{
                    backgroundColor: idx === 0 
                      ? hoveredChar.colors.primary 
                      : idx === 1 
                      ? '#FFAA00' 
                      : idx === 2 
                      ? '#39FF14' 
                      : '#FF003C'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Holographic Header */}
          <div className="space-y-1 mb-4 border-b border-white/10 pb-4">
            <span className="text-xs font-mono tracking-widest uppercase font-bold" style={{ color: hoveredChar.colors.primary }}>
              {hoveredChar.title}
            </span>
            <h3 className="text-3xl font-display font-black italic text-white">
              {hoveredChar.name}
            </h3>
            <p className="text-xs text-white/60 font-body leading-relaxed pt-2">
              {hoveredChar.lore}
            </p>
          </div>

          {/* Stats dossier */}
          <div className="space-y-3 mb-4">
            <h4 className="text-xs font-mono tracking-[0.2em] text-white/40 uppercase">FIGHTER STATS</h4>
            
            <StatRow label="SPEED" value={hoveredChar.stats.walkSpeed * 5} color={hoveredChar.colors.primary} max={1} />
            <StatRow label="POWER / WEIGHT" value={hoveredChar.stats.weight} color={hoveredChar.colors.primary} max={2.0} />
            <StatRow label="JUMP HEIGHT" value={hoveredChar.stats.jumpHeight} color={hoveredChar.colors.primary} max={0.6} />
            <StatRow label="DIFFICULTY" value={hoveredChar.difficulty} color={hoveredChar.colors.primary} max={3} isStars />
          </div>

          {/* Movesets teaser */}
          <div className="space-y-2 flex-1">
            <h4 className="text-xs font-mono tracking-[0.2em] text-white/40 uppercase">SIGNATURE MOVES</h4>
            <div className="flex flex-col gap-2">
              {hoveredChar.moves.filter(m => m.type === 'special' || m.type === 'super').map(move => (
                <div key={move.id} className="flex justify-between items-center bg-white/[0.03] border border-white/5 p-2 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-xs font-display font-black text-white italic">{move.name}</span>
                    <span className="text-[9px] font-mono text-white/40 uppercase">{move.type}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-1 bg-black/40 border border-white/10 text-neon-cyan rounded">
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
