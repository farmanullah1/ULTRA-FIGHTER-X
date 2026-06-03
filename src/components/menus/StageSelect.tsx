import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STAGES } from '@constants/stages'
import { useGameStore } from '@stores/gameStore'
import { audioManager } from '@engine/audio/AudioManager'

export const StageSelect: React.FC = () => {
  const { currentStageId, selectStage, setScreen, startNewMatch } = useGameStore()
  const [hoveredStage, setHoveredStage] = useState(STAGES.find(s => s.id === currentStageId) || STAGES[0])

  useEffect(() => {
    audioManager.announce("Choose your arena")
  }, [])
  
  const handleSelect = (id: string) => {
    selectStage(id)
    audioManager.playSFX('menu_select')
    setTimeout(() => {
      startNewMatch()
      setScreen('vs-screen')
    }, 600)
  }

  const stageThemeColors: Record<string, { primary: string; secondary: string; accent: string }> = {
    'cyber-city': { primary: '#00FFFF', secondary: '#0040FF', accent: '#FF00FF' },
    'volcano': { primary: '#FF6600', secondary: '#FF0000', accent: '#FFAA00' },
    'space-station': { primary: '#8800FF', secondary: '#0066FF', accent: '#00FFFF' },
    'neon-dojo': { primary: '#FF00AA', secondary: '#AA0044', accent: '#FF44AA' },
  }

  const theme = stageThemeColors[hoveredStage.id] || stageThemeColors['cyber-city']

  return (
    <div className="w-full h-full flex flex-col pointer-events-auto overflow-hidden relative">
      
      {/* Full-bleed stage background preview */}
      <AnimatePresence mode="sync">
        <motion.div
          key={hoveredStage.id + '_bg'}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-0"
        >
          <img
            src={`${import.meta.env.BASE_URL}assets/images/stages/${hoveredStage.id.replace(/-/g, '_')}_bg.png`}
            alt={hoveredStage.name}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.88) 100%)`,
            }}
          />
          {/* Colored side vignette matching stage theme */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 80%, ${theme.primary}11 0%, transparent 70%)`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10 px-8 md:px-16 pt-8 md:pt-12">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-xs font-mono tracking-[0.5em] uppercase" style={{ color: theme.primary }}>
            STAGE SELECTION
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-black text-white italic tracking-tighter mt-1 drop-shadow-glow">
            CHOOSE YOUR ARENA
          </h2>
        </motion.div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col lg:flex-row flex-1 items-end gap-6 px-8 md:px-16 pb-8 md:pb-12 mt-8">

        {/* Stage grid - left side */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 w-full lg:max-w-xl">
          {STAGES.map((stage, idx) => {
            const isSelected = currentStageId === stage.id
            const isHovered = hoveredStage.id === stage.id
            const stTheme = stageThemeColors[stage.id] || stageThemeColors['cyber-city']

            return (
              <motion.button
                key={stage.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 + idx * 0.08 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onMouseEnter={() => {
                  setHoveredStage(stage)
                  audioManager.playSFX('menu_hover')
                }}
                onClick={() => handleSelect(stage.id)}
                className={`relative group h-36 md:h-44 overflow-hidden border-2 transition-all duration-300 clip-corner-both cursor-pointer ${
                  isSelected
                    ? 'border-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                    : isHovered
                    ? 'border-white/40'
                    : 'border-white/10'
                }`}
                style={{
                  borderColor: isSelected ? stTheme.primary : isHovered ? stTheme.primary + '88' : 'rgba(255,255,255,0.1)'
                }}
              >
                {/* Stage thumbnail */}
                <img
                  src={`${import.meta.env.BASE_URL}assets/images/stages/${stage.id.replace(/-/g, '_')}_bg.png`}
                  alt={stage.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                    isHovered ? 'opacity-80 scale-105' : 'opacity-50'
                  }`}
                />

                {/* Info overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 flex flex-col justify-end p-3 md:p-4">
                  <span className="text-[9px] md:text-[10px] font-mono tracking-widest uppercase mb-0.5" style={{ color: stTheme.primary }}>
                    {stage.subtitle}
                  </span>
                  <h3 className="text-lg md:text-2xl font-display font-black italic text-white leading-tight uppercase">
                    {stage.name}
                  </h3>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-3.5 h-3.5 rounded-full z-20 animate-pulse shadow-lg"
                    style={{ backgroundColor: stTheme.primary, boxShadow: `0 0 10px ${stTheme.primary}` }}
                  />
                )}

                {/* Hover border glow */}
                {isHovered && (
                  <motion.div
                    layoutId="stage-hover-glow"
                    className="absolute inset-0 z-5 pointer-events-none"
                    style={{ boxShadow: `inset 0 0 20px ${stTheme.primary}33` }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Stage detail panel - right side */}
        <AnimatePresence mode="wait">
          <motion.div
            key={hoveredStage.id}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 bg-black/55 border border-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8 flex flex-col gap-4"
          >
            {/* Cyberpunk corner brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: theme.primary + '88' }} />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: theme.primary + '88' }} />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: theme.primary + '88' }} />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: theme.primary + '88' }} />

            <div>
              <span className="text-xs font-mono tracking-[0.4em] uppercase" style={{ color: theme.primary }}>
                {hoveredStage.subtitle}
              </span>
              <h3 className="text-3xl md:text-5xl font-display font-black italic text-white tracking-tighter mt-1 uppercase drop-shadow-glow">
                {hoveredStage.name}
              </h3>
            </div>

            <p className="text-sm text-white/60 font-body leading-relaxed">
              {hoveredStage.description || 'A legendary battle arena where champions are forged. The environment reacts to every strike, every special move, and every brutal finish.'}
            </p>

            {/* Stage properties */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'RING OUTS', value: hoveredStage.isRingOut ? '⚠️ ENABLED' : '✓ DISABLED', warn: hoveredStage.isRingOut },
                { label: 'WALLS', value: (hoveredStage.id === 'cyber-city' || hoveredStage.id === 'volcano') ? 'Breakable' : 'Open', warn: false },
                { label: 'WEATHER', value: hoveredStage.id === 'cyber-city' ? 'Rain ⛈' : hoveredStage.id === 'volcano' ? 'Ash 🌋' : hoveredStage.id === 'neon-dojo' ? 'Sakura 🌸' : 'Space debris', warn: false },
                { label: 'BGM', value: hoveredStage.id.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' '), warn: false },
              ].map(({ label, value, warn }) => (
                <div key={label} className="bg-white/[0.04] border border-white/8 rounded-lg p-2.5">
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">{label}</span>
                  <span className={`text-sm font-display font-black italic mt-0.5 block ${warn ? 'text-neon-red animate-pulse' : 'text-white'}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Select button */}
            <button
              onClick={() => handleSelect(hoveredStage.id)}
              className="mt-auto py-3 font-display text-xl font-black italic tracking-wider transition-all cursor-pointer clip-corner-both border-2"
              style={{
                background: `linear-gradient(90deg, ${theme.primary}CC, ${theme.secondary}88)`,
                borderColor: theme.primary,
                color: '#000',
                textShadow: 'none',
              }}
            >
              SELECT THIS ARENA →
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => {
          audioManager.playSFX('menu_hover')
          setScreen('character-select')
        }}
        className="absolute top-8 right-8 md:right-16 z-20 text-white/40 font-mono text-xs tracking-widest hover:text-white transition-colors border-b border-transparent hover:border-white pointer-events-auto cursor-pointer uppercase"
      >
        ← BACK TO CHARACTER SELECT
      </motion.button>
    </div>
  )
}
