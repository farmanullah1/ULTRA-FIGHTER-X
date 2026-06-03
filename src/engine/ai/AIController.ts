import type { CharacterBase } from '@engine/characters/CharacterBase'
import type { InputState } from '@game-types/input.types'
import type { Difficulty } from '@game-types/game.types'

interface DifficultyConfig {
  reactionFrames: number
  blockChance: number
  comboChance: number
  aggressionLevel: number
  randomnessFactor: number
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner:   { reactionFrames: 45, blockChance: 0.1, comboChance: 0.2, aggressionLevel: 0.25, randomnessFactor: 0.8 },
  easy:       { reactionFrames: 30, blockChance: 0.3, comboChance: 0.4, aggressionLevel: 0.45, randomnessFactor: 0.6 },
  normal:     { reactionFrames: 18, blockChance: 0.55, comboChance: 0.6, aggressionLevel: 0.65, randomnessFactor: 0.4 },
  hard:       { reactionFrames: 10, blockChance: 0.78, comboChance: 0.82, aggressionLevel: 0.82, randomnessFactor: 0.2 },
  ultra:      { reactionFrames: 4,  blockChance: 0.95, comboChance: 0.95, aggressionLevel: 0.95, randomnessFactor: 0.05 },
}

export class AIController {
  private config: DifficultyConfig
  private lastDecisionFrame: number = 0
  private lastFoughtFrame: number = 0

  constructor(difficulty: Difficulty) {
    this.config = DIFFICULTY_CONFIGS[difficulty]
  }

  generateInput(
    ai: CharacterBase,
    opp: CharacterBase,
    frame: number
  ): InputState {
    const state: InputState = {
      left: false, right: false, up: false, down: false,
      punch: false, kick: false, heavyPunch: false, heavyKick: false,
      special: false, super: false, block: false, dash: false,
    }

    const dist = Math.abs(ai.body.position.x - opp.body.position.x)
    const dz = opp.body.position.z - ai.body.position.z

    // 1. Z-axis realignment: Side-step to align with opponent's Z coordinate
    if (Math.abs(dz) > 0.4 && !ai.currentMove && ai.body.isGrounded) {
      if (dz > 0) {
        state.left = true
      } else {
        state.right = true
      }
      return state // Realignment takes priority over forward walking
    }

    // 2. High-priority Reactive Defense: Block incoming active moves
    if (opp.isAttacking && ai.body.isGrounded) {
      const oppMoveFrame = opp.moveFrame
      // The AI reacts based on its reactionFrames configuration
      if (oppMoveFrame >= this.config.reactionFrames) {
        if (Math.random() < this.config.blockChance) {
          state.block = true
          
          // Crouching block if opponent is using low attacks (e.g. sweep or slide or crouch-kick)
          const oppAnim = opp.currentAnimation || ''
          if (oppAnim.includes('crouch') || oppAnim.includes('slide') || oppAnim.includes('sweep')) {
            state.down = true
          }
          return state // Block takes priority
        }
      }
    }

    // 3. Movement: Closing the distance to engage (AI does not run away!)
    // Note: 'up' key moves character FORWARD (along X towards opponent) in this engine.
    if (dist > 1.35) {
      state.up = true
      
      // Dash forward if far away to engage instantly
      if (dist > 4.5 && Math.random() < 0.15 && (frame - this.lastDecisionFrame > 60)) {
        state.dash = true // Jump forward / dash
        this.lastDecisionFrame = frame
      }
    } 

    // 4. Combat / Aggressive Attacks (triggered based on distance and cooldowns)
    if (dist <= 1.8 && frame - this.lastFoughtFrame >= this.config.reactionFrames) {
      this.lastFoughtFrame = frame

      if (Math.random() < this.config.aggressionLevel && !ai.currentMove) {
        const rand = Math.random()
        const meter = ai.meter

        if (meter >= 1000 && rand < 0.22) {
          // 1. Super Move
          state.super = true
          state.heavyPunch = true
        } 
        else if (rand < 0.35) {
          // 2. Special Move
          state.special = true
          if (Math.random() < 0.5) state.punch = true
          else state.kick = true
        } 
        else if (rand < 0.6) {
          // 3. Heavy Normal attacks
          if (Math.random() < 0.5) state.heavyPunch = true
          else state.heavyKick = true
        } 
        else {
          // 4. Light/Medium Normal attacks
          if (Math.random() < 0.5) state.punch = true
          else state.kick = true
        }

        // Crouch modifier for basic attacks (triggers crouch punch/kick/sweep/uppercut)
        if (Math.random() < 0.4) {
          state.down = true
        }
      }
    }

    return state
  }
}
