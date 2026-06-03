import React, { useEffect } from 'react'
import { useGameStore } from '@stores/gameStore'
import { GameCanvas } from '@components/game/GameCanvas'
import { HUD } from '@components/layout/HUD'
import { VFXOverlay } from '@components/layout/VFXOverlay'
import { CharacterSelect } from '@components/menus/CharacterSelect'
import { StageSelect } from '@components/menus/StageSelect'
import { VsScreen } from './components/menus/VsScreen'
import { SettingsMenu } from '@components/menus/SettingsMenu'
import { PauseMenu } from '@components/game/PauseMenu'
import { AnimatePresence, motion } from 'framer-motion'
import { audioManager } from '@engine/audio/AudioManager'
import './styles/globals.css'

function App() {
  const { screen, setScreen, isPaused, setGameMode } = useGameStore()

  // Start menu music on first user click or key press to obey browser policies
  useEffect(() => {
    const handleInteraction = () => {
      (window as any).__hasUserGesture = true
      audioManager.resume()
      if (screen !== 'battle') {
        audioManager.startMenuMusic()
      }
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('mousedown', handleInteraction)
    }
    window.addEventListener('click', handleInteraction)
    window.addEventListener('keydown', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)
    window.addEventListener('mousedown', handleInteraction)
    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('mousedown', handleInteraction)
    }
  }, [screen])

  // Keep menu and battle tracks distinct on screen transitions
  useEffect(() => {
    if (screen === 'battle') {
      audioManager.stopMenuMusic()
    } else if (screen !== 'loading') {
      audioManager.resume()
      audioManager.startMenuMusic()
    }
  }, [screen])

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
              <VFXOverlay />
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
          ) : screen === 'vs-screen' ? (
            <motion.div
              key="vs-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <VsScreen />
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
              className="w-full h-full flex items-center justify-start pointer-events-auto overflow-hidden"
            >
              {/* Left: Menu Content */}
              <div className="flex flex-col items-start gap-6 md:gap-10 px-6 md:px-12 lg:px-24 py-8 max-w-xl w-full z-10">
                
                {/* System badge */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                  <span className="text-neon-cyan text-xs md:text-sm font-mono tracking-[0.35em] uppercase">System Online — Build 9.10.1</span>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 120 }}
                  className="space-y-1"
                >
                  <h1 className="text-7xl md:text-9xl lg:text-[10rem] font-display font-black text-white italic leading-none tracking-tighter drop-shadow-[0_0_50px_rgba(0,255,255,0.5)] relative">
                    ULTRA
                    <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-white to-neon-magenta drop-shadow-glow">
                      FIGHTER
                    </span>
                    <br/>
                    <span className="text-neon-red drop-shadow-[0_0_30px_rgba(255,0,60,0.7)]">X</span>
                  </h1>
                </motion.div>

                {/* Menu Buttons */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col gap-3 w-full max-w-sm"
                >
                  <MenuButton 
                    label="ARCADE MODE" 
                    icon="🏆"
                    onClick={() => { setGameMode('arcade'); setScreen('character-select'); }} 
                    primary 
                  />
                  <MenuButton 
                    label="VERSUS MODE" 
                    icon="⚔️"
                    onClick={() => { setGameMode('versus'); setScreen('character-select'); }} 
                  />
                  <MenuButton 
                    label="TRAINING LAB" 
                    icon="🎯"
                    onClick={() => { setGameMode('training'); setScreen('character-select'); }} 
                  />
                  <MenuButton 
                    label="SETTINGS" 
                    icon="⚙️"
                    onClick={() => setScreen('settings')} 
                  />
                </motion.div>

                {/* Controls hint */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap gap-3 text-[10px] font-mono text-white/30 mt-2"
                >
                  <span className="border border-white/15 px-2 py-0.5 rounded">WASD / ARROWS — Move</span>
                  <span className="border border-white/15 px-2 py-0.5 rounded">Z — Punch</span>
                  <span className="border border-white/15 px-2 py-0.5 rounded">X — Kick</span>
                  <span className="border border-white/15 px-2 py-0.5 rounded">A — Heavy Punch</span>
                  <span className="border border-white/15 px-2 py-0.5 rounded">S — Heavy Kick</span>
                </motion.div>
              </div>

              {/* Right: Floating character showcase */}
              <div className="hidden lg:flex flex-1 h-full items-end justify-center relative pointer-events-none overflow-hidden">
                {/* Glow backdrop behind characters */}
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-dark-900/60 z-10" />
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-dark-900/80 to-transparent z-10" />

                {/* Character 1 - left */}
                <motion.img
                  src={`${import.meta.env.BASE_URL}assets/images/characters/viper_x.png`}
                  alt="Viper X"
                  initial={{ x: -80, opacity: 0 }}
                  animate={{ x: 0, opacity: 0.65 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  style={{ filter: 'hue-rotate(20deg) saturate(1.4)' }}
                  className="absolute left-0 bottom-0 h-[80%] object-contain"
                />
                {/* Character 2 - center */}
                <motion.img
                  src={`${import.meta.env.BASE_URL}assets/images/characters/kai_storm.png`}
                  alt="Kai Storm"
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 0.9 }}
                  transition={{ delay: 0.25, duration: 0.7, type: 'spring', stiffness: 90 }}
                  className="absolute bottom-0 h-[92%] object-contain drop-shadow-[0_0_30px_rgba(0,255,255,0.45)] z-5"
                />
                {/* Character 3 - right */}
                <motion.img
                  src={`${import.meta.env.BASE_URL}assets/images/characters/phoenix_rise.png`}
                  alt="Phoenix Rise"
                  initial={{ x: 80, opacity: 0 }}
                  animate={{ x: 0, opacity: 0.65 }}
                  transition={{ delay: 0.45, duration: 0.8 }}
                  style={{ filter: 'hue-rotate(15deg) saturate(1.2)', transform: 'scaleX(-1)' }}
                  className="absolute right-0 bottom-0 h-[80%] object-contain"
                />
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
  icon?: string
}

const MenuButton: React.FC<MenuButtonProps> = ({ label, onClick, primary, icon }) => (
  <motion.button
    whileHover={{ x: 16, backgroundColor: primary ? 'var(--neon-cyan)' : 'rgba(0, 255, 255, 0.12)' }}
    whileTap={{ scale: 0.96 }}
    onMouseEnter={() => audioManager.playSFX('menu_hover')}
    onClick={() => {
      audioManager.playSFX('menu_select')
      onClick()
    }}
    className={cn(
      "w-full text-left px-5 md:px-7 py-3 md:py-3.5 font-display text-xl md:text-2xl italic tracking-tighter transition-all clip-corner-tr border-l-4 cursor-pointer flex items-center gap-3",
      primary 
        ? "bg-neon-cyan/80 text-dark-900 border-white font-black" 
        : "bg-white/5 text-neon-cyan border-neon-cyan hover:text-white"
    )}
  >
    {icon && <span className="text-lg md:text-xl not-italic">{icon}</span>}
    {label}
    <span className="ml-auto text-sm opacity-50 not-italic">›</span>
  </motion.button>
)

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}

export default App
