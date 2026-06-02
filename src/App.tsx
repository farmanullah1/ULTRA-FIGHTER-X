import React from 'react'
import { useGameStore } from '@stores/gameStore'
import { GameCanvas } from '@components/game/GameCanvas'
import { HUD } from '@components/layout/HUD'
import { CharacterSelect } from '@components/menus/CharacterSelect'
import { StageSelect } from '@components/menus/StageSelect'
import { SettingsMenu } from '@components/menus/SettingsMenu'
import { PauseMenu } from '@components/game/PauseMenu'
import { AnimatePresence, motion } from 'framer-motion'
import './styles/globals.css'

function App() {
  const { screen, setScreen, isPaused } = useGameStore()

  return (
    <div className="w-full h-full bg-dark-900 text-white overflow-hidden font-body select-none">
      {/* 3D Background Engine */}
      <div className="fixed inset-0 z-0">
        <GameCanvas />
      </div>

      {/* UI Layers */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        <AnimatePresence mode="wait">
          {screen === 'battle' ? (
            <motion.div 
              key="battle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <HUD />
              {isPaused && <PauseMenu />}
            </motion.div>
          ) : screen === 'character-select' ? (
            <motion.div
              key="char-select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <CharacterSelect />
            </motion.div>
          ) : screen === 'stage-select' ? (
            <motion.div
              key="stage-select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <StageSelect />
            </motion.div>
          ) : screen === 'settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full h-full"
            >
              <SettingsMenu />
            </motion.div>
          ) : (
            <motion.div
              key="main-menu"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="w-full h-full flex items-center justify-start p-24 bg-gradient-to-r from-dark-900 via-dark-900/60 to-transparent pointer-events-auto"
            >
              <div className="flex flex-col items-start gap-12 max-w-2xl">
                <div className="space-y-2">
                  <h2 className="text-neon-cyan text-2xl font-display italic tracking-widest animate-pulse">SYSTEM ONLINE</h2>
                  <h1 className="text-9xl font-display font-black text-white italic leading-none tracking-tighter drop-shadow-glow">
                    ULTRA<br/>FIGHTER X
                  </h1>
                </div>

                <div className="flex flex-col gap-4 w-full">
                  <MenuButton label="ARCADE MODE" onClick={() => setScreen('character-select')} primary />
                  <MenuButton label="VERSUS" onClick={() => setScreen('character-select')} />
                  <MenuButton label="TRAINING" onClick={() => setScreen('character-select')} />
                  <MenuButton label="SETTINGS" onClick={() => setScreen('settings')} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Screen Effects Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-cyber-grid opacity-10" />
      <div className="fixed inset-0 pointer-events-none z-50 bg-scanline" />
    </div>
  )
}

interface MenuButtonProps {
  label: string
  onClick: () => void
  primary?: boolean
}

const MenuButton: React.FC<MenuButtonProps> = ({ label, onClick, primary }) => (
  <motion.button
    whileHover={{ x: 20, backgroundColor: primary ? 'var(--neon-cyan)' : 'rgba(0, 255, 255, 0.1)' }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={cn(
      "w-full text-left px-8 py-4 font-display text-2xl italic tracking-tighter transition-colors clip-corner-tr border-l-4",
      primary 
        ? "bg-neon-cyan/80 text-dark-900 border-white" 
        : "bg-white/5 text-neon-cyan border-neon-cyan hover:text-white"
    )}
  >
    {label}
  </motion.button>
)

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}

export default App
