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
  beginner:   { reactionFrames: 45, blockChance: 0.1, comboChance: 0.2, aggressionLevel: 0.2, randomnessFactor: 0.9 },
  easy:       { reactionFrames: 30, blockChance: 0.25, comboChance: 0.4, aggressionLevel: 0.4, randomnessFactor: 0.7 },
  normal:     { reactionFrames: 18, blockChance: 0.5, comboChance: 0.6, aggressionLevel: 0.6, randomnessFactor: 0.4 },
  hard:       { reactionFrames: 10, blockChance: 0.75, comboChance: 0.8, aggressionLevel: 0.8, randomnessFactor: 0.2 },
  ultra:      { reactionFrames: 4,  blockChance: 0.95, comboChance: 0.95, aggressionLevel: 0.95, randomnessFactor: 0.05 },
}

export class AIController {
  private config: DifficultyConfig
  private lastDecisionFrame: number = 0

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

    if (frame - this.lastDecisionFrame < this.config.reactionFrames) return state

    const dist = Math.abs(ai.body.position.x - opp.body.position.x)
    const aiIsLeft = ai.body.position.x < opp.body.position.x

    // Simple reactive AI logic
    if (opp.isAttacking && Math.random() < this.config.blockChance) {
      state[aiIsLeft ? 'left' : 'right'] = true
    } else if (dist > 2) {
      state[aiIsLeft ? 'right' : 'left'] = true
    } else if (dist < 1.5 && Math.random() < this.config.aggressionLevel) {
      state.punch = true
    }

    this.lastDecisionFrame = frame
    return state
  }
}
