import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import type { GameSettings } from '@game-types/game.types'
import { DEFAULT_CONTROLS_P1, DEFAULT_CONTROLS_P2 } from '@constants/gameConstants'

interface SettingsActions {
  setVolume: (type: 'sfx' | 'music', val: number) => void
  setRoundTime: (t: number) => void
  setRounds: (r: number) => void
  setDifficulty: (d: GameSettings['difficulty']) => void
  toggleHitboxes: () => void
  toggleFPS: () => void
  resetToDefaults: () => void
}

type SettingsState = GameSettings & SettingsActions

const defaults: GameSettings = {
  sfxVolume: 0.8,
  musicVolume: 0.5,
  roundTime: 99,
  rounds: 3,
  difficulty: 'normal',
  showHitboxes: false,
  showFPS: false,
  vibration: true,
  controls: {
    player1: DEFAULT_CONTROLS_P1,
    player2: DEFAULT_CONTROLS_P2,
  },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set) => ({
      ...defaults,
      setVolume: (type, val) => set((s) => {
        if (type === 'sfx') s.sfxVolume = val
        else s.musicVolume = val
      }),
      setRoundTime: (t) => set((s) => { s.roundTime = t }),
      setRounds: (r) => set((s) => { s.rounds = r }),
      setDifficulty: (d) => set((s) => { s.difficulty = d }),
      toggleHitboxes: () => set((s) => { s.showHitboxes = !s.showHitboxes }),
      toggleFPS: () => set((s) => { s.showFPS = !s.showFPS }),
      resetToDefaults: () => set(() => ({ ...defaults })),
    })),
    { name: 'ufx-settings' }
  )
)
