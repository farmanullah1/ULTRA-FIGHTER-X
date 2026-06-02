import React from 'react'
import { motion } from 'framer-motion'
import { useSettingsStore } from '@stores/settingsStore'
import { useGameStore } from '@stores/gameStore'

export const SettingsMenu: React.FC = () => {
  const { 
    sfxVolume, musicVolume, showFPS, showHitboxes, 
    setVolume, toggleFPS, toggleHitboxes, resetToDefaults 
  } = useSettingsStore()
  const { setScreen } = useGameStore()

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-12 bg-dark-900/95 backdrop-blur-2xl pointer-events-auto">
      <motion.h2 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-6xl font-display font-black text-neon-cyan italic mb-16 tracking-tighter"
      >
        SYSTEM CONFIGURATION
      </motion.h2>

      <div className="flex flex-col gap-10 max-w-2xl w-full">
        {/* Audio Settings */}
        <div className="space-y-6">
          <h3 className="text-xl font-display text-white/50 tracking-widest uppercase border-l-4 border-neon-cyan pl-4">Audio</h3>
          <div className="grid grid-cols-1 gap-6">
            <VolumeSlider 
              label="MUSIC VOLUME" 
              value={musicVolume} 
              onChange={(v) => setVolume('music', v)} 
            />
            <VolumeSlider 
              label="SFX VOLUME" 
              value={sfxVolume} 
              onChange={(v) => setVolume('sfx', v)} 
            />
          </div>
        </div>

        {/* Graphics Settings */}
        <div className="space-y-6">
          <h3 className="text-xl font-display text-white/50 tracking-widest uppercase border-l-4 border-neon-magenta pl-4">Visuals</h3>
          <div className="flex gap-4">
            <ToggleBtn 
              label="SHOW FPS" 
              active={showFPS} 
              onClick={toggleFPS} 
            />
            <ToggleBtn 
              label="SHOW HITBOXES" 
              active={showHitboxes} 
              onClick={toggleHitboxes} 
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => setScreen('main-menu')}
            className="flex-1 py-4 bg-neon-cyan text-dark-900 font-display font-black italic text-xl hover:bg-white transition-colors clip-corner-both"
          >
            SAVE & EXIT
          </button>
          <button 
            onClick={resetToDefaults}
            className="px-8 py-4 border border-white/20 text-white font-display hover:bg-white/10 transition-colors clip-corner-both"
          >
            DEFAULTS
          </button>
        </div>
      </div>
    </div>
  )
}

const VolumeSlider: React.FC<{ label: string, value: number, onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-end">
      <span className="text-sm font-display text-white tracking-widest">{label}</span>
      <span className="text-xl font-display text-neon-cyan">{Math.round(value * 100)}%</span>
    </div>
    <input 
      type="range" 
      min="0" 
      max="1" 
      step="0.01" 
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
    />
  </div>
)

const ToggleBtn: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-4 font-display text-sm tracking-widest transition-all border clip-corner-both ${
      active ? 'bg-neon-magenta/20 border-neon-magenta text-neon-magenta' : 'bg-white/5 border-white/10 text-white/40'
    }`}
  >
    {label}: {active ? 'ON' : 'OFF'}
  </button>
)
