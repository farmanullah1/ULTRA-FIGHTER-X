export type GameScreen = 
  | 'loading'
  | 'main-menu'
  | 'character-select'
  | 'stage-select'
  | 'vs-screen'
  | 'battle'
  | 'victory'
  | 'game-over'
  | 'settings'
  | 'online'
  | 'movelist'

export type GameMode = 
  | 'arcade'
  | 'versus'
  | 'training'
  | 'online'
  | 'story'
  | 'survival'
  | 'time-attack'
  | 'attract'

export type Difficulty = 'beginner' | 'easy' | 'normal' | 'hard' | 'ultra'

export interface Vector3D {
  x: number
  y: number
  z: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface GameSettings {
  sfxVolume: number
  musicVolume: number
  roundTime: number
  rounds: number
  difficulty: Difficulty
  showHitboxes: boolean
  showFPS: boolean
  vibration: boolean
  graphicsQuality: 'low' | 'medium' | 'ultra'
  controls: {
    player1: ControlMap
    player2: ControlMap
  }
}

export interface ControlMap {
  left: string
  right: string
  up: string
  down: string
  punch: string
  kick: string
  heavyPunch: string
  heavyKick: string
  special: string
  super: string
  block: string
  dash: string
}

export interface RoundResult {
  winner: 'player1' | 'player2' | 'draw'
  timeLeft: number
  perfectRound: boolean
}

export interface MatchStats {
  player1: {
    damageDealt: number
    combosLanded: number
    longestCombo: number
    specials: number
    supers: number
    perfectRounds: number
  }
  player2: {
    damageDealt: number
    combosLanded: number
    longestCombo: number
    specials: number
    supers: number
    perfectRounds: number
  }
}
