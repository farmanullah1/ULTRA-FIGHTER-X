import type { Vector3D } from './game.types'

export type CharacterID = 
  | 'kai-storm'
  | 'viper-x'
  | 'iron-claw'
  | 'nova-star'
  | 'shadow-byte'
  | 'phoenix-rise'

export type AnimationState = 
  | 'idle'
  | 'walk-forward'
  | 'walk-backward'
  | 'jump'
  | 'crouch'
  | 'block'
  | 'crouch-block'
  | 'punch-light'
  | 'punch-heavy'
  | 'kick-light'
  | 'kick-heavy'
  | 'special-1'
  | 'special-2'
  | 'special-3'
  | 'super'
  | 'hit-stun'
  | 'knockdown'
  | 'getup'
  | 'victory'
  | 'defeat'
  | 'dash-forward'
  | 'dash-backward'
  | 'air-attack'
  | 'throw'
  | 'thrown'
  | 'taunt'

export type AttackType = 
  | 'light-punch' 
  | 'heavy-punch' 
  | 'light-kick' 
  | 'heavy-kick' 
  | 'special' 
  | 'super'
  | 'throw'

export interface HitboxFrame {
  frameStart: number
  frameEnd: number
  x: number
  y: number
  z: number
  width: number
  height: number
  depth: number
  type: 'attack' | 'hurt' | 'push' | 'throw'
  damage?: number
  hitstun?: number
  blockstun?: number
  knockback?: Vector3D
}

export interface Move {
  id: string
  name: string
  input: string           // e.g. "⬇️↘️➡️ + P"
  inputSequence: string[] // keyboard sequence
  damage: number
  meterGain: number
  meterCost: number
  cancelable: boolean
  invincible: boolean
  startup: number         // frames
  active: number          // frames
  recovery: number        // frames
  onHit: number           // frame advantage
  onBlock: number         // frame advantage
  hitboxes: HitboxFrame[]
  animationState: AnimationState
  projectile?: ProjectileConfig
  type: AttackType
}

export interface ProjectileConfig {
  speed: number
  width: number
  height: number
  depth: number
  damage: number
  color: string
  glowColor: string
  lifespan: number        // frames
}

export interface CharacterStats {
  health: number
  walkSpeed: number
  dashSpeed: number
  jumpHeight: number
  gravity: number
  weight: number          // affects hitstun & knockback
  meterMax: number
}

export interface CharacterDef {
  id: CharacterID
  name: string
  title: string           // e.g. "The Storm Caller"
  lore: string            // 2-3 sentence backstory
  difficulty: 1 | 2 | 3  // difficulty to play
  archetype: 'rushdown' | 'zoner' | 'grappler' | 'balanced' | 'tricky' | 'powerhouse'
  stats: CharacterStats
  moves: Move[]
  colors: {
    primary: string
    secondary: string
    aura: string
    healthBarColor: string
    meterColor: string
  }
  modelPath: string        // Path to .glb file
}
