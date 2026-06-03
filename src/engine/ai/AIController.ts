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

    const dx = opp.body.position.x - ai.body.position.x
    const dist = Math.abs(dx)
    const dz = opp.body.position.z - ai.body.position.z
    const isOpponentOnRight = dx > 0
    const archetype = ai.def.archetype || 'balanced'

    // Archetype Spacing Configurations
    interface SpacingConfig {
      minDist: number
      maxDist: number
      projectileChance: number
      dashForwardChance: number
      backdashChance: number
      jumpChance: number
    }

    const ARCHETYPE_CONFIGS: Record<string, SpacingConfig> = {
      rushdown: { minDist: 0.8, maxDist: 1.4, projectileChance: 0.05, dashForwardChance: 0.25, backdashChance: 0.05, jumpChance: 0.15 },
      zoner:    { minDist: 3.5, maxDist: 5.5, projectileChance: 0.65, dashForwardChance: 0.02, backdashChance: 0.28, jumpChance: 0.05 },
      grappler: { minDist: 0.8, maxDist: 1.25, projectileChance: 0.0, dashForwardChance: 0.08, backdashChance: 0.02, jumpChance: 0.02 },
      balanced: { minDist: 1.3, maxDist: 2.4, projectileChance: 0.25, dashForwardChance: 0.12, backdashChance: 0.10, jumpChance: 0.10 },
      tricky:   { minDist: 1.2, maxDist: 2.2, projectileChance: 0.20, dashForwardChance: 0.18, backdashChance: 0.15, jumpChance: 0.15 },
      powerhouse: { minDist: 1.0, maxDist: 1.8, projectileChance: 0.10, dashForwardChance: 0.10, backdashChance: 0.05, jumpChance: 0.05 },
    }

    const spacing = ARCHETYPE_CONFIGS[archetype] || ARCHETYPE_CONFIGS.balanced

    // 1. Z-axis realignment using Block + Up/Down sidestep controls
    if (Math.abs(dz) > 0.4 && !ai.currentMove && ai.body.isGrounded) {
      state.block = true
      if (dz > 0) {
        state.up = true // Sidestep +Z (background)
      } else {
        state.down = true // Sidestep -Z (foreground)
      }
      return state // Realignment takes priority
    }

    // 2. High-priority Reactive Defense: Block incoming active moves
    if (opp.isAttacking && ai.body.isGrounded) {
      const oppMoveFrame = opp.moveFrame
      if (oppMoveFrame >= this.config.reactionFrames) {
        if (Math.random() < this.config.blockChance) {
          state.block = true
          
          // Crouching block if opponent is using low attacks
          const oppAnim = opp.currentAnimation || ''
          if (oppAnim.includes('crouch') || oppAnim.includes('slide') || oppAnim.includes('sweep')) {
            state.down = true
          }
          return state // Block takes priority
        }
      }
    }

    // 3. Movement spacing adjustments
    let wantsToMoveForward = false
    let wantsToMoveBackward = false

    if (dist > spacing.maxDist) {
      wantsToMoveForward = true
    } else if (dist < spacing.minDist) {
      wantsToMoveBackward = true
    }

    if (wantsToMoveForward && !ai.currentMove) {
      // Walk forward (X-axis)
      if (isOpponentOnRight) {
        state.right = true
      } else {
        state.left = true
      }

      // Grappler walking block pressure (hold block occasionally while walking forward)
      if (archetype === 'grappler' && Math.random() < 0.35) {
        state.block = true
      }

      // Dash forward if far away to engage instantly
      if (dist > spacing.maxDist * 1.5 && Math.random() < spacing.dashForwardChance && (frame - this.lastDecisionFrame > 90)) {
        state.dash = true
        this.lastDecisionFrame = frame
      }
      // Jump forward
      else if (Math.random() < spacing.jumpChance * 0.15 && (frame - this.lastDecisionFrame > 90)) {
        state.up = true
        this.lastDecisionFrame = frame
      }
    } 
    else if (wantsToMoveBackward && !ai.currentMove) {
      // Walk backward (X-axis)
      if (isOpponentOnRight) {
        state.left = true
      } else {
        state.right = true
      }

      // Auto-block while retreating
      state.block = true

      // Backdash to build space
      if (Math.random() < spacing.backdashChance && (frame - this.lastDecisionFrame > 90)) {
        state.dash = true
        this.lastDecisionFrame = frame
      }
    }

    // 4. Combat / Aggressive Attacks (triggered based on distance and reaction frames)
    if (frame - this.lastFoughtFrame >= this.config.reactionFrames && !ai.currentMove) {
      this.lastFoughtFrame = frame

      const inAttackRange = dist <= 1.8
      const isZonerInProjRange = archetype === 'zoner' && dist >= 3.0 && dist <= 5.5

      if ((inAttackRange || isZonerInProjRange) && Math.random() < this.config.aggressionLevel) {
        const rand = Math.random()
        const meter = ai.meter

        // Zoner projectile spam
        if (isZonerInProjRange) {
          if (Math.random() < spacing.projectileChance) {
            state.super = true // L button triggers standard special
            state.punch = true
          }
        }
        // Grappler close-range throw priority
        else if (archetype === 'grappler' && dist <= 1.25) {
          if (rand < 0.5) {
            // Steel Press command grab or standard throw
            if (meter >= 200 && Math.random() < 0.4) {
              state.special = true // O button (EX command grab)
              state.kick = true
            } else {
              // Standard grab uses punch + kick
              state.punch = true
              state.kick = true
            }
          } else {
            // Heavy stomp or heavy punch pressure
            if (Math.random() < 0.5) state.heavyPunch = true
            else state.heavyKick = true
          }
        }
        // Normal characters close-range combo logic
        else if (inAttackRange) {
          if (meter >= 1000 && rand < 0.25) {
            // Super / Rage Art (super + heavyPunch)
            state.super = true
            state.heavyPunch = true
          } 
          else if (rand < 0.50) {
            // Special moves (super/special + attack button)
            if (meter >= 200 && Math.random() < 0.4) {
              state.special = true // EX special
            } else {
              state.super = true // Standard special
            }
            if (Math.random() < 0.5) state.punch = true
            else state.kick = true
          } 
          else if (rand < 0.75) {
            // Heavy attacks
            if (Math.random() < 0.5) state.heavyPunch = true
            else state.heavyKick = true
          } 
          else {
            // Light attacks
            if (Math.random() < 0.5) state.punch = true
            else state.kick = true
          }

          // Random crouch modifier
          if (Math.random() < 0.4) {
            state.down = true
          }
        }
      }
    }

    return state;
  }
}
