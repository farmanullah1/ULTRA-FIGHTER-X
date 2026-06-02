import React from 'react'
import { motion } from 'framer-motion'
import { STAGES } from '@constants/stages'
import { useGameStore } from '@stores/gameStore'

export const StageSelect: React.FC = () => {
  const { currentStageId, selectStage, setScreen, startNewMatch } = useGameStore()
  
  const handleSelect = (id: string) => {
    selectStage(id)
    setTimeout(() => {
      startNewMatch()
      setScreen('battle')
    }, 500)
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-12 bg-dark-900/90 backdrop-blur-xl pointer-events-auto">
      <motion.h2 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-5xl font-display font-black text-neon-magenta italic mb-12 tracking-tighter"
      >
        CHOOSE YOUR ARENA
      </motion.h2>

      <div className="grid grid-cols-2 gap-8 max-w-5xl w-full">
        {STAGES.map((stage) => (
          <motion.button
            key={stage.id}
            whileHover={{ scale: 1.02, borderColor: 'var(--neon-cyan)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(stage.id)}
            className={`relative group h-80 overflow-hidden border-2 transition-all clip-corner-both ${
              currentStageId === stage.id ? 'border-neon-cyan bg-neon-cyan/10' : 'border-white/10 bg-white/5'
            }`}
          >
            {/* Stage Preview Placeholder */}
            <div className={`absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity bg-gradient-to-br ${
              stage.theme === 'volcano' ? 'from-red-900 to-orange-600' : 'from-blue-900 to-cyan-700'
            }`} />

            {/* Stage Info */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 z-10 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent">
              <span className="text-sm font-display text-neon-cyan tracking-widest uppercase opacity-60">
                {stage.subtitle}
              </span>
              <h3 className="text-4xl font-display font-black italic text-white group-hover:text-neon-cyan transition-colors uppercase">
                {stage.name}
              </h3>
            </div>

            {/* Selection Glow */}
            {currentStageId === stage.id && (
              <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-neon-cyan animate-pulse shadow-neon-cyan" />
            )}
          </motion.button>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setScreen('character-select')}
        className="mt-12 text-white/50 font-display hover:text-white transition-colors"
      >
        BACK TO FIGHTER SELECT
      </motion.button>
    </div>
  )
}
