import React from 'react'
import { motion } from 'framer-motion'
import { useSettingsStore } from '@stores/settingsStore'
import { useGameStore } from '@stores/gameStore'
import { audioManager } from '@engine/audio/AudioManager'

export const SettingsMenu: React.FC = () => {
  const { 
    sfxVolume, musicVolume, showFPS, showHitboxes, graphicsQuality,
    setVolume, toggleFPS, toggleHitboxes, setGraphicsQuality, resetToDefaults 
  } = useSettingsStore()
  const { setScreen } = useGameStore()

  const handleSave = () => {
    audioManager.playSFX('menu_select')
    setScreen('main-menu')
  }

  const handleDefaults = () => {
    audioManager.playSFX('menu_select')
    resetToDefaults()
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-12 bg-dark-900/95 backdrop-blur-2xl pointer-events-auto overflow-y-auto">
      <motion.h2 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-4xl md:text-6xl font-display font-black text-neon-cyan italic mb-10 md:mb-16 tracking-tighter text-center"
      >
        SYSTEM CONFIGURATION
      </motion.h2>

      <div className="flex flex-col gap-8 md:gap-10 max-w-2xl w-full">
        {/* Audio Settings */}
        <div className="space-y-4 md:space-y-6">
          <h3 className="text-lg md:text-xl font-display text-white/50 tracking-widest uppercase border-l-4 border-neon-cyan pl-4">Audio</h3>
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <VolumeSlider 
              label="MUSIC VOLUME" 
              value={musicVolume} 
              onChange={(v) => {
                setVolume('music', v)
                audioManager.setVolume('music', v)
              }} 
            />
            <VolumeSlider 
              label="SFX VOLUME" 
              value={sfxVolume} 
              onChange={(v) => {
                setVolume('sfx', v)
                audioManager.setVolume('sfx', v)
              }} 
            />
          </div>
        </div>

        {/* Graphics Quality */}
        <div className="space-y-4 md:space-y-6">
          <h3 className="text-lg md:text-xl font-display text-white/50 tracking-widest uppercase border-l-4 border-neon-magenta pl-4 font-bold">Graphics</h3>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-white/50 tracking-widest">VISUAL RENDERING PROFILE</span>
            <div className="flex bg-black/40 border border-white/10 p-1 rounded-xl gap-2 w-full">
              {(['low', 'medium', 'ultra'] as const).map(quality => (
                <button
                  key={quality}
                  onMouseEnter={() => audioManager.playSFX('menu_hover')}
                  onClick={() => {
                    audioManager.playSFX('menu_select')
                    setGraphicsQuality(quality)
                  }}
                  className={`flex-1 py-3 font-display text-xs md:text-sm font-black italic tracking-widest uppercase rounded-lg transition-all cursor-pointer ${
                    graphicsQuality === quality
                      ? 'bg-neon-magenta text-dark-900 font-extrabold shadow-[0_0_15px_rgba(255,0,255,0.4)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Graphics Settings */}
        <div className="space-y-4 md:space-y-6">
          <h3 className="text-lg md:text-xl font-display text-white/50 tracking-widest uppercase border-l-4 border-neon-magenta pl-4">Visuals</h3>
          <div className="flex gap-4">
            <ToggleBtn 
              label="SHOW FPS" 
              active={showFPS} 
              onClick={() => {
                audioManager.playSFX('menu_select')
                toggleFPS()
              }} 
            />
            <ToggleBtn 
              label="SHOW HITBOXES" 
              active={showHitboxes} 
              onClick={() => {
                audioManager.playSFX('menu_select')
                toggleHitboxes()
              }} 
            />
          </div>
        </div>

        <div className="flex gap-4 mt-4 md:mt-8">
          <button 
            onClick={handleSave}
            onMouseEnter={() => audioManager.playSFX('menu_hover')}
            className="flex-1 py-4 bg-neon-cyan text-dark-900 font-display font-black italic text-lg md:text-xl hover:bg-white transition-colors clip-corner-both cursor-pointer"
          >
            SAVE & EXIT
          </button>
          <button 
            onClick={handleDefaults}
            onMouseEnter={() => audioManager.playSFX('menu_hover')}
            className="px-6 md:px-8 py-4 border border-white/20 text-white font-display hover:bg-white/10 transition-colors clip-corner-both cursor-pointer"
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
      <span className="text-xs md:text-sm font-display text-white tracking-widest">{label}</span>
      <span className="text-lg md:text-xl font-display text-neon-cyan">{Math.round(value * 100)}%</span>
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
    onMouseEnter={() => audioManager.playSFX('menu_hover')}
    className={`flex-1 py-4 font-display text-xs md:text-sm tracking-widest transition-all border clip-corner-both cursor-pointer ${
      active ? 'bg-neon-magenta/20 border-neon-magenta text-neon-magenta' : 'bg-white/5 border-white/10 text-white/40'
    }`}
  >
    {label}: {active ? 'ON' : 'OFF'}
  </button>
)
