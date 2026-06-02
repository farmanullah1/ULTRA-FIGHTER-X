import React from 'react'
import { motion } from 'framer-motion'
import { CHARACTERS } from '@constants/characters'
import { useGameStore } from '@stores/gameStore'
import type { CharacterID } from '@game-types/character.types'

export const CharacterSelect: React.FC = () => {
  const { player1CharId, selectCharacter, setScreen } = useGameStore()
  
  const handleSelect = (id: CharacterID) => {
    selectCharacter(1, id)
    // For now, randomly select P2
    const otherChars = CHARACTERS.filter(c => c.id !== id)
    const randomP2 = otherChars[Math.floor(Math.random() * otherChars.length)].id
    selectCharacter(2, randomP2)
    
    setTimeout(() => {
      useGameStore.getState().setGameMode('arcade')
      setScreen('battle')
    }, 500)
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-12 bg-dark-900/90 backdrop-blur-xl pointer-events-auto">
      <motion.h2 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-5xl font-display font-black text-neon-cyan italic mb-12 tracking-tighter"
      >
        SELECT YOUR FIGHTER
      </motion.h2>

      <div className="grid grid-cols-3 gap-8 max-w-6xl w-full">
        {CHARACTERS.map((char) => (
          <motion.button
            key={char.id}
            whileHover={{ scale: 1.05, borderColor: char.colors.primary }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(char.id)}
            className={`relative group h-64 overflow-hidden border-2 transition-all clip-corner-both ${
              player1CharId === char.id ? 'border-neon-cyan bg-neon-cyan/20' : 'border-white/10 bg-white/5'
            }`}
          >
            {/* Character Info */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 z-10 bg-gradient-to-t from-dark-900 via-transparent to-transparent">
              <span className="text-sm font-display text-neon-cyan tracking-widest uppercase opacity-60">
                {char.archetype}
              </span>
              <h3 className="text-3xl font-display font-black italic text-white group-hover:text-neon-cyan transition-colors">
                {char.name}
              </h3>
            </div>

            {/* Background Glow */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
              style={{ backgroundColor: char.colors.primary }}
            />
          </motion.button>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setScreen('main-menu')}
        className="mt-12 text-white/50 font-display hover:text-white transition-colors"
      >
        BACK TO MENU
      </motion.button>
    </div>
  )
}
