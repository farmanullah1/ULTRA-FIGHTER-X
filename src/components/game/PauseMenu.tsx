import React from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@stores/gameStore'

export const PauseMenu: React.FC = () => {
  const { setPaused, setScreen, resetMatch } = useGameStore()

  const handleQuit = () => {
    setPaused(false)
    resetMatch()
    setScreen('main-menu')
  }

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-dark-900/60 backdrop-blur-md pointer-events-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="cyber-panel p-12 flex flex-col gap-6 min-w-[400px] clip-corner-both"
      >
        <div className="flex flex-col items-center gap-2 mb-4">
          <h2 className="text-4xl font-display font-black text-neon-cyan italic tracking-tighter">PAUSED</h2>
          <div className="w-24 h-1 bg-neon-cyan shadow-neon-cyan" />
        </div>

        <PauseButton label="RESUME BATTLE" onClick={() => setPaused(false)} primary />
        <PauseButton label="COMMAND LIST" onClick={() => {}} />
        <PauseButton label="SETTINGS" onClick={() => {}} />
        <PauseButton label="QUIT TO MENU" onClick={handleQuit} danger />
      </motion.div>
    </div>
  )
}

const PauseButton: React.FC<{ label: string, onClick: () => void, primary?: boolean, danger?: boolean }> = ({ label, onClick, primary, danger }) => (
  <motion.button
    whileHover={{ x: 10 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full py-4 font-display text-xl italic tracking-tight border-l-4 transition-all clip-corner-tr ${
      primary 
        ? 'bg-neon-cyan text-dark-900 border-white' 
        : danger 
          ? 'bg-neon-red/20 text-neon-red border-neon-red hover:bg-neon-red hover:text-white'
          : 'bg-white/5 text-white/60 border-white/20 hover:text-white hover:bg-white/10'
    }`}
  >
    {label}
  </motion.button>
)
