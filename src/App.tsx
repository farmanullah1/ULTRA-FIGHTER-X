import React from 'react'
import { useGameStore } from '@stores/gameStore'
import { GameCanvas } from '@components/game/GameCanvas'
import { HUD } from '@components/layout/HUD'
import { AnimatePresence, motion } from 'framer-motion'
import './styles/globals.css'

function App() {
  const { screen } = useGameStore()

  return (
    <div className="w-full h-full bg-dark-900 text-white overflow-hidden font-body">
      <AnimatePresence mode="wait">
        {screen === 'battle' ? (
          <motion.div 
            key="battle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full"
          >
            <GameCanvas />
            <HUD />
          </motion.div>
        ) : (
          <motion.div
            key="menus"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex items-center justify-center"
          >
            {/* Main Menu Placeholder */}
            <div className="flex flex-col items-center gap-8">
              <h1 className="text-8xl font-display font-black text-neon-cyan italic tracking-tighter text-shadow-glow">
                ULTRA FIGHTER X
              </h1>
              <button 
                onClick={() => useGameStore.getState().setScreen('battle')}
                className="px-12 py-4 bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan font-display text-2xl hover:bg-neon-cyan hover:text-dark-900 transition-all clip-corner-both"
              >
                START BATTLE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
