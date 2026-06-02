import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { GameScreen, GameMode, RoundResult, MatchStats } from '@game-types/game.types'
import type { CharacterID } from '@game-types/character.types'

interface GameState {
  screen: GameScreen
  gameMode: GameMode | null
  
  // Character selections
  player1CharId: CharacterID | null
  player2CharId: CharacterID | null
  player1ColorIndex: number
  player2ColorIndex: number
  
  // Match state
  currentRound: number
  roundsWon: { player1: number; player2: number }
  currentStageId: string
  
  // In-battle state
  player1Health: number
  player2Health: number
  player1Meter: number
  player2Meter: number
  roundTimeLeft: number
  isPaused: boolean
  isBattleActive: boolean
  
  // Round results
  roundResults: RoundResult[]
  matchStats: MatchStats
  
  // Combo counters
  player1Combo: number
  player2Combo: number
  player1ComboTimer: number
  player2ComboTimer: number
  battleState: 'waiting' | 'starting' | 'active' | 'ko' | 'round-end'
  matchId: number

  // Actions
  setScreen: (screen: GameScreen) => void
  setBattleState: (state: 'waiting' | 'starting' | 'active' | 'ko' | 'round-end') => void
  startNewMatch: () => void
  setGameMode: (mode: GameMode) => void
  selectCharacter: (player: 1 | 2, id: CharacterID) => void
  selectColor: (player: 1 | 2, index: number) => void
  selectStage: (stageId: string) => void
  updateHealth: (player: 1 | 2, hp: number) => void
  updateMeter: (player: 1 | 2, meter: number) => void
  updateTimer: (time: number) => void
  incrementCombo: (player: 1 | 2) => void
  resetCombo: (player: 1 | 2) => void
  recordRoundResult: (result: RoundResult) => void
  setPaused: (paused: boolean) => void
  resetMatch: () => void
}

export const useGameStore = create<GameState>()(
  immer((set) => ({
    screen: 'loading',
    gameMode: null,
    player1CharId: null,
    player2CharId: null,
    player1ColorIndex: 0,
    player2ColorIndex: 0,
    currentRound: 1,
    roundsWon: { player1: 0, player2: 0 },
    currentStageId: 'cyber-city',
    player1Health: 1000,
    player2Health: 1000,
    player1Meter: 0,
    player2Meter: 0,
    roundTimeLeft: 99,
    isPaused: false,
    isBattleActive: false,
    roundResults: [],
    matchStats: {
      player1: { damageDealt: 0, combosLanded: 0, longestCombo: 0, specials: 0, supers: 0, perfectRounds: 0 },
      player2: { damageDealt: 0, combosLanded: 0, longestCombo: 0, specials: 0, supers: 0, perfectRounds: 0 },
    },
    player1Combo: 0,
    player2Combo: 0,
    player1ComboTimer: 0,
    player2ComboTimer: 0,
    battleState: 'waiting',
    matchId: 0,

    setScreen: (screen) => set(state => { state.screen = screen }),
    setBattleState: (battleState) => set(state => { state.battleState = battleState }),
    startNewMatch: () => set(state => {
      state.matchId++
      state.player1Health = 1000
      state.player2Health = 1000
      state.roundTimeLeft = 99
      state.battleState = 'waiting'
      state.player1Combo = 0
      state.player2Combo = 0
    }),
    setGameMode: (mode) => set(state => { state.gameMode = mode }),
    selectCharacter: (player, id) => set(state => {
      if (player === 1) state.player1CharId = id
      else state.player2CharId = id
    }),
    selectColor: (player, index) => set(state => {
      if (player === 1) state.player1ColorIndex = index
      else state.player2ColorIndex = index
    }),
    selectStage: (stageId) => set(state => { state.currentStageId = stageId }),
    updateHealth: (player, hp) => set(state => {
      if (player === 1) state.player1Health = Math.max(0, hp)
      else state.player2Health = Math.max(0, hp)
    }),
    updateMeter: (player, meter) => set(state => {
      if (player === 1) state.player1Meter = Math.min(1000, Math.max(0, meter))
      else state.player2Meter = Math.min(1000, Math.max(0, meter))
    }),
    updateTimer: (time) => set(state => { state.roundTimeLeft = time }),
    incrementCombo: (player) => set(state => {
      if (player === 1) {
        state.player1Combo++
        state.player1ComboTimer = 90
      } else {
        state.player2Combo++
        state.player2ComboTimer = 90
      }
    }),
    resetCombo: (player) => set(state => {
      if (player === 1) { state.player1Combo = 0; state.player1ComboTimer = 0 }
      else { state.player2Combo = 0; state.player2ComboTimer = 0 }
    }),
    recordRoundResult: (result) => set(state => {
      state.roundResults.push(result)
      if (result.winner === 'player1') state.roundsWon.player1++
      else if (result.winner === 'player2') state.roundsWon.player2++
      state.currentRound++
    }),
    setPaused: (paused) => set(state => { state.isPaused = paused }),
    resetMatch: () => set(state => {
      state.player1Health = 1000
      state.player2Health = 1000
      state.player1Meter = 0
      state.player2Meter = 0
      state.roundTimeLeft = 99
      state.roundResults = []
      state.roundsWon = { player1: 0, player2: 0 }
      state.currentRound = 1
      state.isBattleActive = false
      state.player1Combo = 0
      state.player2Combo = 0
    }),
  }))
)
