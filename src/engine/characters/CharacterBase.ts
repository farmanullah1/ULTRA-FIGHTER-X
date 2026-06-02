import { PhysicsEngine, type PhysicsBody } from '@engine/core/PhysicsEngine'
import type { CharacterDef, AnimationState, Move } from '@game-types/character.types'
import type { InputState } from '@game-types/input.types'
import type { InputBuffer } from '@game-types/input.types'
import { STARTING_HEALTH, MAX_METER } from '@constants/gameConstants'
import type { AbstractMesh, TransformNode, AnimationGroup } from '@babylonjs/core'

export class CharacterBase {
  id: string
  def: CharacterDef
  body: PhysicsBody
  health: number = STARTING_HEALTH
  meter: number = 0
  facingRight: boolean = true
  
  // 3D Rendering Refs
  rootNode: TransformNode | null = null
  mesh: AbstractMesh | null = null
  animations: Map<AnimationState, AnimationGroup> = new Map()
  
  // Animation state machine
  currentAnimation: AnimationState = 'idle'
  animationFrame: number = 0
  animationTimer: number = 0
  
  // Combat state
  isInHitstun: boolean = false
  hitstunTimer: number = 0
  isInBlockstun: boolean = false
  blockstunTimer: number = 0
  isKnockedDown: boolean = false
  getupTimer: number = 0
  currentMove: Move | null = null
  moveFrame: number = 0
  hasLandedHit: boolean = false
  isInvincible: boolean = false
  isBlocking: boolean = false
  
  // Hitstop
  hitstopTimer: number = 0
  
  // Combo tracking
  comboCount: number = 0
  lastHitFrame: number = 0

  // Callbacks
  onSpawnProjectile: ((config: any, pos: any, facingRight: boolean) => void) | null = null

  constructor(def: CharacterDef, startX: number, facingRight: boolean) {
    this.id = def.id
    this.def = def
    this.facingRight = facingRight
    
    this.body = {
      position: { x: startX, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      width: 1.2,
      height: 2.5,
      depth: 0.5,
      isGrounded: true,
      isAirborne: false,
      mass: def.stats.weight,
      isFrozen: false,
    }
  }

  update(input: InputState, inputBuffer: InputBuffer, frame: number, physics: PhysicsEngine, inputManager: any): void {
    // Update hitstop
    if (this.hitstopTimer > 0) {
      this.hitstopTimer--
      this.body.isFrozen = true
      return
    }
    this.body.isFrozen = false

    // Update timers
    if (this.hitstunTimer > 0) this.hitstunTimer--
    if (this.blockstunTimer > 0) this.blockstunTimer--
    if (this.getupTimer > 0) this.getupTimer--

    const isStunned = this.hitstunTimer > 0 || this.blockstunTimer > 0
    
    if (!isStunned && !this.isKnockedDown) {
      this.processInput(input, inputBuffer, frame, physics, inputManager)
    }
    
    physics.update(this.body)
    this.update3DNode()
    this.updateAnimation()
  }

  private update3DNode(): void {
    if (this.rootNode) {
      this.rootNode.position.x = this.body.position.x
      this.rootNode.position.y = this.body.position.y
      this.rootNode.position.z = this.body.position.z
      
      // Face the opponent
      this.rootNode.rotation.y = this.facingRight ? Math.PI / 2 : -Math.PI / 2
    }
  }

  private processInput(
    input: InputState,
    buffer: InputBuffer,
    frame: number,
    physics: PhysicsEngine,
    inputManager: any
  ): void {
    const { walkSpeed, jumpHeight } = this.def.stats

    if (this.currentMove) return

    // 1. Check for Special Moves first (highest precedence)
    const sortedMoves = [...this.def.moves].sort((a, b) => b.inputSequence.length - a.inputSequence.length)

    for (const move of sortedMoves) {
      if (move.inputSequence.length > 1) {
        // Adjust sequence for facing direction (F/B flip)
        const adjustedSequence = move.inputSequence.map(token => {
          if (!this.facingRight) {
            if (token === 'F') return 'B'
            if (token === 'B') return 'F'
            if (token === 'DF') return 'DB'
            if (token === 'DB') return 'DF'
          }
          return token
        })

        if (inputManager.checkInputSequence(buffer, adjustedSequence)) {
          this.triggerAttack(move.id, frame)
          return
        }
      }
    }

    // Basic movement
    const moveDir = this.facingRight
      ? (input.right ? 1 : input.left ? -1 : 0)
      : (input.left ? 1 : input.right ? -1 : 0)


    if (moveDir !== 0 && !this.currentMove) {
      this.body.velocity.x = moveDir * walkSpeed
      this.currentAnimation = moveDir > 0 ? 'walk-forward' : 'walk-backward'
    }

    // Jump
    if (input.up && this.body.isGrounded) {
      physics.jump(this.body, jumpHeight)
      this.currentAnimation = 'jump'
    }

    // Crouch
    if (input.down && this.body.isGrounded) {
      this.currentAnimation = 'crouch'
    }

    // Block
    const isHoldingBack = this.facingRight ? input.left : input.right
    this.isBlocking = isHoldingBack && this.body.isGrounded

    // Basic attacks
    if (input.punch && !input.down) this.triggerAttack('punch-light', frame)
    if (input.kick && !input.down) this.triggerAttack('kick-light', frame)
    if (input.heavyPunch) this.triggerAttack('punch-heavy', frame)
    if (input.heavyKick) this.triggerAttack('kick-heavy', frame)

    // Idle fallback
    if (!input.left && !input.right && !input.down && this.body.isGrounded && !this.currentMove) {
      this.currentAnimation = 'idle'
    }
  }

  private triggerAttack(type: string, _frame: number): void {
    const move = this.def.moves.find(m => m.id === type)
    if (move && !this.currentMove) {
      this.currentMove = move
      this.moveFrame = 0
      this.hasLandedHit = false
      this.currentAnimation = move.animationState
    }
  }

  receiveHit(damage: number, hitstun: number, knockback: { x: number; y: number; z: number }): void {
    this.health = Math.max(0, this.health - damage)
    this.hitstunTimer = hitstun
    this.currentMove = null
    this.isBlocking = false
    this.body.velocity.x = knockback.x * (this.facingRight ? -1 : 1)
    this.body.velocity.y = knockback.y
    this.body.velocity.z = knockback.z
    this.currentAnimation = 'hit-stun'
    this.meter = Math.min(MAX_METER, this.meter + 20)
  }

  receiveBlock(damage: number, blockstun: number): void {
    this.health = Math.max(0, this.health - damage)
    this.blockstunTimer = blockstun
    this.currentAnimation = 'block'
  }

  applyHitstop(frames: number): void {
    this.hitstopTimer = frames
  }

  private updateAnimation(): void {
    if (this.currentMove) {
      this.moveFrame++
      
      // Spawn projectile on first active frame
      if (this.moveFrame === this.currentMove.startup && this.currentMove.projectile) {
        const spawnPos = {
          x: this.body.position.x + (this.facingRight ? 1 : -1),
          y: this.body.position.y + 1.5,
          z: this.body.position.z
        }
        this.onSpawnProjectile?.(this.currentMove.projectile, spawnPos, this.facingRight)
      }

      const totalFrames = this.currentMove.startup + this.currentMove.active + this.currentMove.recovery
      if (this.moveFrame >= totalFrames) {
        this.currentMove = null
        this.moveFrame = 0
        this.currentAnimation = 'idle'
      }
    }
    
    // Play Babylon Animation Group
    const anim = this.animations.get(this.currentAnimation)
    if (anim && !anim.isPlaying) {
      // Stop other animations
      this.animations.forEach(a => { if (a !== anim) a.stop() })
      anim.play(true)
    }
    
    this.animationTimer++
  }

  get isDead(): boolean { return this.health <= 0 }
  get isAttacking(): boolean { return this.currentMove !== null }
  get meterPercent(): number { return this.meter / MAX_METER }
  get healthPercent(): number { return this.health / STARTING_HEALTH }
}
