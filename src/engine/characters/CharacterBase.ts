import { PhysicsEngine, type PhysicsBody } from '@engine/core/PhysicsEngine'
import type { CharacterDef, AnimationState, Move } from '@game-types/character.types'
import type { InputState } from '@game-types/input.types'
import type { InputBuffer } from '@game-types/input.types'
import { STARTING_HEALTH, MAX_METER } from '@constants/gameConstants'
import { TransformNode, AbstractMesh, AnimationGroup, Color3 } from '@babylonjs/core'
import { audioManager } from '@engine/audio/AudioManager'
export class CharacterBase {
  id: string
  def: CharacterDef
  body: PhysicsBody
  health: number = STARTING_HEALTH
  meter: number = 0
  facingRight: boolean = true
  throwOwner: CharacterBase | null = null

  // 3D Fighter additions
  sidestepTimer: number = 0
  sidestepDir: number = 0 // 1 for background (up), -1 for foreground (down)
  isSidewalking: boolean = false
  sidewalkDir: number = 0
  isOverdriveActive: boolean = false
  overdriveTimer: number = 0
  crouchDashTimer: number = 0
  isParrying: boolean = false
  parryTimer: number = 0
  isBeingThrown: boolean = false
  throwBreakTimer: number = 0
  throwBreakPressed: boolean = false
  justQuickShifted: boolean = false
  quickShiftVFXTimer: number = 0
  dashTimer: number = 0
  dashDirection: 'forward' | 'backward' | null = null

  // Jump weight & Landing weight
  preJumpTimer: number = 0
  preJumpVelocityY: number = 0
  landingLagTimer: number = 0
  wasAirborne: boolean = false

  // Systemic combat scaling and states
  juggleCount: number = 0
  comboHitsReceived: number = 0
  isEXActive: boolean = false

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
  initialHitstun: number = 0
  isInBlockstun: boolean = false
  blockstunTimer: number = 0
  isKnockedDown: boolean = false
  getupTimer: number = 0
  currentMove: Move | null = null
  moveFrame: number = 0
  hasLandedHit: boolean = false
  isInvincible: boolean = false
  isBlocking: boolean = false
  isPoisoned: boolean = false
  poisonTimer: number = 0
  
  // Hitstop
  hitstopTimer: number = 0
  
  // Combo tracking
  comboCount: number = 0
  lastHitFrame: number = 0

  // Callbacks
  onSpawnProjectile: ((config: any, pos: any, facingRight: boolean) => void) | null = null
  onSuperFlash: (() => void) | null = null
  onSpawnParticles: ((type: string, pos: any, color?: string) => void) | null = null

  // Part mesh cache for procedural animations
  private partCache: Map<string, AbstractMesh | null> = new Map()

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

  private getPart(name: string): AbstractMesh | null {
    if (!this.rootNode) return null
    if (this.partCache.has(name)) {
      return this.partCache.get(name) || null
    }

    const meshes = this.rootNode.getChildMeshes(false)
    const part = meshes.find(m => m.name === name) || null
    this.partCache.set(name, part)
    return part
  }

  update(
    input: InputState,
    inputBuffer: InputBuffer,
    frame: number,
    physics: PhysicsEngine,
    inputManager: any,
    opponentPos?: { x: number; y: number; z: number }
  ): void {
    // Update hitstop
    if (this.hitstopTimer > 0) {
      this.hitstopTimer--
      this.body.isFrozen = true
      return
    }
    this.body.isFrozen = false

    // Update landing lag
    if (this.landingLagTimer > 0) {
      this.landingLagTimer--
    }

    // Update pre-jump squat
    if (this.preJumpTimer > 0) {
      this.preJumpTimer--
      if (this.preJumpTimer === 0) {
        physics.jump(this.body, this.preJumpVelocityY)
        this.currentAnimation = 'jump'
      } else {
        this.body.velocity.x = 0
        this.body.velocity.z = 0
        this.currentAnimation = 'crouch'
        physics.update(this.body)
        this.update3DNode(opponentPos)
        this.updateAnimation()
        return
      }
    }

    // Update Overdrive Timers
    if (this.overdriveTimer > 0) {
      this.overdriveTimer--
      if (this.overdriveTimer === 0) {
        this.isOverdriveActive = false
      }
    }

    // Update poison state
    if (this.isPoisoned && this.poisonTimer > 0) {
      this.poisonTimer--
      if (frame % 15 === 0) {
        this.health = Math.max(1, this.health - 5)
      }
      if (this.poisonTimer === 0) {
        this.isPoisoned = false
      }
    }

    // Update 3D fighter timers & velocities
    if (this.sidestepTimer > 0) {
      this.sidestepTimer--
      this.body.velocity.z = this.sidestepDir * 0.15
      if (this.sidestepTimer === 0) {
        this.body.velocity.z = 0
      }
    }

    // Update Dash timers & velocities
    if (this.dashTimer > 0) {
      this.dashTimer--
      const speed = this.def.stats.dashSpeed
      const directionMult = this.dashDirection === 'forward' ? 1 : -1
      this.body.velocity.x = (this.facingRight ? 1 : -1) * speed * directionMult
      this.currentAnimation = this.dashDirection === 'forward' ? 'dash-forward' : 'dash-backward'
      
      // Spawn dash dust step particles continuously
      if (this.dashTimer % 3 === 0) {
        this.onSpawnParticles?.('dust-step', this.body.position, '#888888')
      }
      
      if (this.dashTimer === 0) {
        this.body.velocity.x = 0
        this.dashDirection = null
        this.currentAnimation = 'idle'
      }
    }

    // Sidewalk Z-axis movement
    if (this.isSidewalking && !this.currentMove) {
      const dirKey = this.sidewalkDir === 1 ? 'left' : 'right'
      if (!input[dirKey]) {
        this.isSidewalking = false
        this.sidewalkDir = 0
        this.body.velocity.z = 0
      } else {
        this.body.velocity.z = this.sidewalkDir * 0.22
        this.currentAnimation = 'walk-forward'
      }
    }

    if (this.crouchDashTimer > 0) {
      this.crouchDashTimer--
      this.body.velocity.x = (this.facingRight ? 1 : -1) * this.def.stats.walkSpeed * 2.2
      this.currentAnimation = 'crouch'
      if (this.crouchDashTimer === 0) {
        this.body.velocity.x = 0
      }
    }
    if (this.parryTimer > 0) {
      this.parryTimer--
      if (this.parryTimer === 0) {
        this.isParrying = false
      }
    }
    if (this.quickShiftVFXTimer > 0) {
      this.quickShiftVFXTimer--
      if (this.quickShiftVFXTimer === 0) {
        this.justQuickShifted = false
      }
    }

    // Handle throw mechanics (lock position/actions)
    if (this.isBeingThrown) {
      if (this.throwBreakTimer > 0) {
        this.throwBreakTimer--
        if (input.punch && input.kick) {
          this.throwBreakPressed = true
        }
      }
      this.update3DNode(opponentPos)
      this.updateAnimation()
      return
    }

    // Update standard timers
    if (this.hitstunTimer > 0) {
      this.hitstunTimer--
      if (this.hitstunTimer === 0) {
        this.isInHitstun = false
        this.currentAnimation = 'idle'
        this.juggleCount = 0
        this.comboHitsReceived = 0
      }
    }
    if (this.blockstunTimer > 0) {
      this.blockstunTimer--
      if (this.blockstunTimer === 0) {
        this.isInBlockstun = false
        this.currentAnimation = 'idle'
      }
    }
    if (this.getupTimer > 0) {
      this.getupTimer--
      if (this.getupTimer > 30) {
        this.currentAnimation = 'knockdown'
      } else if (this.getupTimer > 0) {
        this.currentAnimation = 'getup'
      } else {
        this.isKnockedDown = false
        this.currentAnimation = 'idle'
      }
    }

    // Wake-up kick trigger
    if (this.isKnockedDown && (input.kick || input.heavyKick)) {
      this.isKnockedDown = false
      this.getupTimer = 0
      this.triggerAttack('kick-wakeup', frame)
    }

    const isStunned = this.hitstunTimer > 0 || this.blockstunTimer > 0
    
    // EX Quick Shift Cancel Check during attack frames
    if (this.currentMove && !isStunned && !this.isKnockedDown) {
      const canCancel = this.moveFrame > this.currentMove.startup
      if (canCancel && input.dash && this.meter >= 200) {
        this.meter -= 200
        this.currentMove = null
        this.moveFrame = 0
        this.justQuickShifted = true
        this.quickShiftVFXTimer = 15
        
        // Quick shift into a sidestep based on directional input
        if (input.down) {
          this.sidestepTimer = 12
          this.sidestepDir = -1
        } else {
          this.sidestepTimer = 12
          this.sidestepDir = 1
        }
      }
    }

    // Special / Super Command Canceling checks (Street Fighter Style)
    if (this.currentMove && !isStunned && !this.isKnockedDown) {
      let allowedToCancel = false
      if (this.hasLandedHit) {
        if (this.currentMove.cancelable && this.currentMove.type !== 'special' && this.currentMove.type !== 'super') {
          allowedToCancel = true
        } else if (this.currentMove.type === 'special' && (this.meter >= 1000 || this.isOverdriveActive)) {
          allowedToCancel = true
        }
      }

      if (allowedToCancel) {
        this.checkCancelInputs(input, inputBuffer, frame, physics, inputManager)
      }
    }

    if (!isStunned && !this.isKnockedDown && this.dashTimer === 0) {
      this.processInput(input, inputBuffer, frame, physics, inputManager)
    }
    
    // Adjust height dynamically for crouching / crouch-dashing to dodge highs
    const isCrouchedState = this.currentAnimation === 'crouch' || 
                            this.currentAnimation === 'crouch-block' ||
                            this.crouchDashTimer > 0
    this.body.height = isCrouchedState ? 1.1 : 2.5

    // Launcher float: reduce gravity if airborne in heavy hitstun (hitstun > 25)
    if (this.isInHitstun && this.initialHitstun > 25 && this.body.isAirborne) {
      this.body.gravityScaleOverride = 0.45
    } else {
      this.body.gravityScaleOverride = undefined
    }

    physics.update(this.body)

    // Landing lag detection
    if (this.wasAirborne && this.body.isGrounded && !this.body.isAirborne) {
      this.landingLagTimer = 2
      this.wasAirborne = false
      this.currentAnimation = 'crouch'
      this.body.velocity.x = 0
      this.body.velocity.z = 0
      this.onSpawnParticles?.('dust-land', this.body.position, '#888888')
    }
    if (this.body.isAirborne) {
      this.wasAirborne = true
    }

    // Knockdown landing check
    const landed = this.body.isGrounded && !this.body.isAirborne && (this.body.velocity.y <= 0) && (this.isInHitstun && this.initialHitstun > 25)
    if (landed) {
      this.isInHitstun = false
      this.hitstunTimer = 0
      this.isKnockedDown = true
      this.getupTimer = 45 // stays flat for 15 frames, then interpolates getup for 30 frames
      this.currentAnimation = 'knockdown'
      this.body.velocity.x = 0
      this.body.velocity.z = 0
      this.juggleCount = 0
      this.comboHitsReceived = 0
    }
    this.update3DNode(opponentPos)
    this.updateAnimation()
  }

  private update3DNode(opponentPos?: { x: number; y: number; z: number }): void {
    if (this.rootNode) {
      this.rootNode.position.x = this.body.position.x
      this.rootNode.position.y = this.body.position.y
      this.rootNode.position.z = this.body.position.z
      
      // Face the opponent dynamically in 3D
      if (opponentPos) {
        const dx = opponentPos.x - this.body.position.x
        const dz = opponentPos.z - this.body.position.z
        // Align model's forward vector (+X default) with opponent
        this.rootNode.rotation.y = Math.PI / 2 - Math.atan2(dz, dx)
      } else {
        this.rootNode.rotation.y = this.facingRight ? Math.PI / 2 : -Math.PI / 2
      }
    }
  }

  private processInput(
    input: InputState,
    buffer: InputBuffer,
    frame: number,
    _physics: PhysicsEngine,
    inputManager: any
  ): void {
    const { walkSpeed, jumpHeight } = this.def.stats

    if (this.landingLagTimer > 0) {
      this.isBlocking = input.block && this.body.isGrounded
      if (this.isBlocking) {
        this.currentAnimation = 'block'
      } else {
        this.currentAnimation = 'crouch'
      }
      return
    }

    if (this.currentMove) return

    // 0. Overdrive Activation (EX Modifier L + Power Attack M)
    if (input.super && input.heavyPunch && this.meter >= 1000 && !this.isOverdriveActive) {
      this.meter = 0
      this.isOverdriveActive = true
      this.overdriveTimer = 300 // 5 seconds
      this.onSuperFlash?.()
      return
    }

    // 1. Throws (Light Punch + Light Kick: punch && kick / B && N)
    if (input.punch && input.kick && this.body.isGrounded) {
      this.triggerAttack('throw', frame)
      return
    }

    // 2. Parry / Guard Impact (Light Punch + Block: punch && block / B && K)
    if (input.punch && input.block && this.body.isGrounded) {
      this.isParrying = true
      this.parryTimer = 10
      this.currentAnimation = 'block'
      return
    }

    // 3. Sidestepping and Sidewalking (left is A / Background, right is D / Foreground)
    if (this.body.isGrounded) {
      if (this.checkDoubleTap(buffer, 'up')) {
        this.dashTimer = 15
        this.dashDirection = 'forward'
        this.currentAnimation = 'dash-forward'
        return
      }
      if (this.checkDoubleTap(buffer, 'down')) {
        this.dashTimer = 15
        this.dashDirection = 'backward'
        this.currentAnimation = 'dash-backward'
        return
      }

      if (this.checkDoubleTap(buffer, 'left')) {
        this.isSidewalking = true
        this.sidewalkDir = 1
        return
      }
      if (this.checkDoubleTap(buffer, 'right')) {
        this.isSidewalking = true
        this.sidewalkDir = -1
        return
      }
      
      const lastIdx = buffer.frames.length - 1
      const leftJustPressed = input.left && !buffer.frames[lastIdx - 1]?.state.left
      const rightJustPressed = input.right && !buffer.frames[lastIdx - 1]?.state.right
      
      if (leftJustPressed) {
        this.sidestepTimer = 12
        this.sidestepDir = 1
        return
      }
      if (rightJustPressed) {
        this.sidestepTimer = 12
        this.sidestepDir = -1
        return
      }
    }

    // 4. Short Hop / Jump (Space / input.dash)
    if (input.dash && this.body.isGrounded && this.preJumpTimer === 0) {
      this.preJumpTimer = 3
      this.preJumpVelocityY = jumpHeight * 0.7
      this.currentAnimation = 'crouch'
      return
    }

    // 5. Special Moves triggered via Special modifier button (L / input.super)
    if (input.super && this.body.isGrounded) {
      if (input.punch) {
        this.triggerAttack('special-bolt', frame, false)
        return
      }
      if (input.kick) {
        this.triggerAttack('special-kick', frame, false)
        return
      }
      if (input.heavyPunch) {
        // Super / Rage Art (cinematic supers)
        if (this.meter >= 1000 || this.isOverdriveActive) {
          this.triggerAttack('super-storm', frame)
          return
        }
      }
    }

    // 6. EX Special Moves triggered via EX modifier button (O / input.special)
    if (input.special && this.body.isGrounded) {
      if (input.punch) {
        this.triggerAttack('special-bolt', frame, true)
        return
      }
      if (input.kick) {
        this.triggerAttack('special-kick', frame, true)
        return
      }
    }

    // Also support motion inputs sequences for backward compatibility
    const sortedMoves = [...this.def.moves].sort((a, b) => b.inputSequence.length - a.inputSequence.length)
    for (const move of sortedMoves) {
      if (move.inputSequence.length > 1) {
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

    // Basic movement (Up: Forward W, Down: Back S / Crouch)
    if (input.up && !this.currentMove) {
      this.body.velocity.x = (this.facingRight ? 1 : -1) * walkSpeed
      this.currentAnimation = 'walk-forward'
    } else if (input.down && !this.currentMove) {
      // Crouch walk backward
      this.body.velocity.x = (this.facingRight ? -1 : 1) * walkSpeed * 0.7
      this.currentAnimation = 'crouch'
    }

    // Basic attacks
    if (input.punch) {
      const isSidestepping = this.sidestepTimer > 0 || this.isSidewalking
      const isCrouching = input.down || this.currentAnimation === 'crouch'
      
      if (isSidestepping) {
        this.triggerAttack('punch-hook', frame)
      } else if (isCrouching) {
        this.triggerAttack('punch-uppercut', frame)
      } else {
        this.triggerAttack('punch-light', frame)
      }
    }
    if (input.kick) {
      this.triggerAttack('kick-light', frame)
    }
    if (input.heavyPunch) {
      this.triggerAttack('punch-heavy', frame) // Consumes 50 meter inside triggerAttack
    }
    if (input.heavyKick) {
      this.triggerAttack('kick-heavy', frame)
    }

    // Block
    this.isBlocking = input.block && this.body.isGrounded

    // Idle fallback
    if (!input.up && !input.down && !input.left && !input.right && this.body.isGrounded && !this.currentMove && !this.isSidewalking) {
      this.currentAnimation = 'idle'
    }
  }

  private checkCancelInputs(
    input: InputState,
    buffer: InputBuffer,
    frame: number,
    _physics: PhysicsEngine,
    inputManager: any
  ): void {
    // 1. Super / Rage Art (cinematic supers)
    if (input.super && input.heavyPunch && (this.meter >= 1000 || this.isOverdriveActive)) {
      this.currentMove = null
      this.triggerAttack('super-storm', frame)
      return
    }

    // 2. Special Moves via buttons
    if (input.super) {
      if (input.punch) {
        this.currentMove = null
        this.triggerAttack('special-bolt', frame, false)
        return
      }
      if (input.kick) {
        this.currentMove = null
        this.triggerAttack('special-kick', frame, false)
        return
      }
    }

    // 3. EX Special Moves via buttons
    if (input.special) {
      if (input.punch) {
        this.currentMove = null
        this.triggerAttack('special-bolt', frame, true)
        return
      }
      if (input.kick) {
        this.currentMove = null
        this.triggerAttack('special-kick', frame, true)
        return
      }
    }

    // 4. Command Inputs (Motion sequences)
    if (this.currentMove && this.currentMove.type !== 'special') {
      const sortedMoves = [...this.def.moves].sort((a, b) => b.inputSequence.length - a.inputSequence.length)
      for (const move of sortedMoves) {
        if (move.inputSequence.length > 1 && move.type === 'special') {
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
            this.currentMove = null
            this.triggerAttack(move.id, frame)
            return
          }
        }
      }
    }
  }

  private checkDoubleTap(buffer: InputBuffer, direction: 'up' | 'down' | 'left' | 'right'): boolean {
    const frames = buffer.frames
    if (frames.length < 5) return false

    const lastIdx = frames.length - 1
    if (!frames[lastIdx].state[direction]) return false

    // Trace back the current tap start
    let i = lastIdx
    while (i >= 0 && frames[i].state[direction]) {
      i--
    }
    if (i < 0) return false
    const currentPressStartFrame = frames[i + 1].frame

    // Trace back the release period
    while (i >= 0 && !frames[i].state[direction]) {
      i--
    }
    if (i < 0) return false
    const prevPressEndFrame = frames[i].frame

    // Match double tap time intervals (2 to 12 frames)
    const gap = currentPressStartFrame - prevPressEndFrame
    if (gap > 12 || gap < 2) return false

    // Verify first tap duration
    while (i >= 0 && frames[i].state[direction]) {
      i--
    }
    const prevPressStartFrame = frames[i + 1].frame
    const firstPressDuration = prevPressEndFrame - prevPressStartFrame
    if (firstPressDuration > 12) return false // Too slow

    // Restrict trigger only to the first active frame of second tap
    const currentFrame = frames[lastIdx].frame
    if (currentFrame !== currentPressStartFrame) return false

    return true
  }

  triggerAttack(type: string, _frame: number, isEX: boolean = false): void {
    // If Overdrive is active, upgrade Iron Claw grabs
    let overrideType = type
    if (this.isOverdriveActive && this.id === 'iron-claw' && type === 'throw') {
      overrideType = 'throw-earth-crush'
    }

    const move = overrideType === 'throw'
      ? {
          id: 'throw', name: 'Standard Throw', input: 'LP+LK', inputSequence: [], damage: 120, meterGain: 20, meterCost: 0, cancelable: false, invincible: false, startup: 6, active: 4, recovery: 22, onHit: 0, onBlock: 0, animationState: 'punch-heavy', type: 'throw',
          hitboxes: [{ frameStart: 6, frameEnd: 10, x: 0.4, y: 1.0, z: 0, width: 0.8, height: 0.8, depth: 0.8, type: 'throw', damage: 120, knockback: { x: 0.4, y: 0.3, z: 0 } }]
        } as Move
      : (overrideType === 'throw-earth-crush'
        ? {
            id: 'throw', name: 'Earth Crush', input: 'EX Grab', inputSequence: [], damage: 200, meterGain: 0, meterCost: 0, cancelable: false, invincible: true, startup: 8, active: 5, recovery: 24, onHit: 0, onBlock: 0, animationState: 'special-1', type: 'throw',
            hitboxes: [{ frameStart: 8, frameEnd: 12, x: 0.5, y: 1.0, z: 0, width: 1.2, height: 1.2, depth: 1.2, type: 'throw', damage: 200, knockback: { x: 0.8, y: 0.4, z: 0 } }]
          } as Move
        : (overrideType === 'kick-wakeup'
          ? {
              id: 'kick-wakeup', name: 'Wakeup Kick', input: 'K', inputSequence: [], damage: 45, meterGain: 15, meterCost: 0, cancelable: false, invincible: false, startup: 6, active: 4, recovery: 15, onHit: 12, onBlock: -4, animationState: 'kick-light', type: 'light-kick',
              hitboxes: [{ frameStart: 6, frameEnd: 10, x: 0.5, y: 0.2, z: 0, width: 0.8, height: 0.3, depth: 0.6, type: 'attack', damage: 45, knockback: { x: 0.4, y: 0.1, z: 0 } }]
            } as Move
          : (overrideType === 'punch-light'
            ? {
                id: 'punch-light', name: 'Jab', input: 'B', inputSequence: [], damage: 30, meterGain: 10, meterCost: 0, cancelable: true, invincible: false, startup: 4, active: 3, recovery: 3, onHit: 6, onBlock: 1, animationState: 'punch-light', type: 'light-punch',
                hitboxes: [{ frameStart: 4, frameEnd: 7, x: 0.5, y: 1.3, z: 0, width: 0.6, height: 0.3, depth: 0.4, type: 'attack', damage: 30 }]
              } as Move
            : (overrideType === 'punch-hook'
              ? {
                  id: 'punch-hook', name: 'Hook', input: 'B', inputSequence: [], damage: 50, meterGain: 15, meterCost: 0, cancelable: true, invincible: false, startup: 6, active: 4, recovery: 6, onHit: 10, onBlock: -2, animationState: 'punch-heavy', type: 'heavy-punch',
                  hitboxes: [{ frameStart: 6, frameEnd: 10, x: 0.6, y: 1.2, z: 0, width: 0.7, height: 0.4, depth: 0.5, type: 'attack', damage: 50, knockback: { x: 0.25, y: 0.05, z: 0.2 } }]
                } as Move
              : (overrideType === 'punch-uppercut'
                ? {
                    id: 'punch-uppercut', name: 'Uppercut', input: 'B', inputSequence: [], damage: 70, meterGain: 20, meterCost: 0, cancelable: false, invincible: false, startup: 8, active: 4, recovery: 6, onHit: 15, onBlock: -6, animationState: 'special-1', type: 'heavy-punch',
                    hitboxes: [{ frameStart: 8, frameEnd: 12, x: 0.5, y: 0.8, z: 0, width: 0.8, height: 0.8, depth: 0.6, type: 'attack', damage: 70, knockback: { x: 0.2, y: 0.52, z: 0 } }]
                  } as Move
                : this.def.moves.find(m => m.id === overrideType))))))

    if (move && !this.currentMove) {
      // Power Attack consumes 50 meter
      if (overrideType === 'punch-heavy') {
        if (this.meter < 50) return
        this.meter -= 50
      }

      // Check Meter Cost / EX Cost
      let finalCost = move.meterCost
      let isEXApplied = false
      if (isEX && move.type === 'special') {
        if (this.meter < 200) return
        finalCost = 200
        isEXApplied = true
      } else {
        if (move.meterCost > 0 && this.meter < move.meterCost) return
      }

      this.meter -= finalCost

      if (isEXApplied) {
        this.isEXActive = true
        this.onSpawnParticles?.('hit-spark', this.body.position, '#FFAA00')
        audioManager.playSFX('super_chime', 0.4)

        // Upgrade special move stats for EX copy
        const upgradedMove = { ...move }
        upgradedMove.damage = Math.round(upgradedMove.damage * 1.3)
        upgradedMove.hitboxes = upgradedMove.hitboxes.map(h => ({
          ...h,
          damage: h.damage !== undefined ? Math.round(h.damage * 1.3) : undefined,
          width: h.width * 1.2,
          height: h.height * 1.2
        }))
        upgradedMove.invincible = true // Grant full EX startup invincibility!
        
        if (upgradedMove.projectile) {
          upgradedMove.projectile = {
            ...upgradedMove.projectile,
            damage: Math.round(upgradedMove.projectile.damage * 1.35),
            speed: upgradedMove.projectile.speed * 1.25,
            color: '#FFAA00',
            glowColor: '#FFAA00'
          }
        }
        this.currentMove = upgradedMove
      } else {
        this.currentMove = move
      }

      this.moveFrame = 0
      this.hasLandedHit = false
      this.currentAnimation = this.currentMove.animationState
      
      // Signal Super Flash
      if (this.currentMove.type === 'super') {
        this.onSuperFlash?.()
      }
    }
  }

  receiveHit(damage: number, hitstun: number, knockback: { x: number; y: number; z: number }): void {
    // 1. Combo scaling: scale down damage as the combo grows to reward short bursts
    this.comboHitsReceived++
    const comboScale = Math.max(0.2, 1.05 - this.comboHitsReceived * 0.05)

    let finalDamage = damage
    let finalHitstun = hitstun
    let finalKnockbackY = knockback.y

    // 2. Air Juggle scaling: increase gravity scale and decay knockback on airborne opponents
    if (this.body.isAirborne) {
      this.juggleCount++
      const juggleScale = Math.max(0.3, 1.0 - this.juggleCount * 0.12)
      finalDamage = Math.round(damage * juggleScale * comboScale)

      // Reduce launch height of subsequent air hits to prevent infinite height loops
      finalKnockbackY = knockback.y * Math.max(0.25, 1.0 - this.juggleCount * 0.15)

      // Decay hitstun
      finalHitstun = Math.max(4, Math.round(hitstun * Math.max(0.3, 1.0 - this.juggleCount * 0.12)))
    } else {
      this.juggleCount = 0
      finalDamage = Math.round(damage * comboScale)
    }

    this.health = Math.max(0, this.health - finalDamage)
    this.hitstunTimer = finalHitstun
    this.initialHitstun = finalHitstun
    this.isInHitstun = true
    this.currentMove = null
    this.isBlocking = false
    this.dashTimer = 0
    this.dashDirection = null
    this.body.velocity.x = knockback.x * (this.facingRight ? -1 : 1)
    this.body.velocity.y = finalKnockbackY
    this.body.velocity.z = knockback.z
    this.currentAnimation = 'hit-stun'
    this.meter = Math.min(MAX_METER, this.meter + 40)

    if (this.isDead) {
      this.currentAnimation = 'defeat'
      this.isKnockedDown = true
      this.getupTimer = 0
    }
  }

  receiveBlock(damage: number, blockstun: number): void {
    this.health = Math.max(0, this.health - damage)
    this.blockstunTimer = blockstun
    this.isInBlockstun = true
    this.currentAnimation = 'block'
    this.dashTimer = 0
    this.dashDirection = null
    this.meter = Math.min(MAX_METER, this.meter + 10)
  }

  applyHitstop(frames: number): void {
    this.hitstopTimer = frames
  }

  updateAnimation(): void {
    if (this.currentMove) {
      this.moveFrame++

      // Spawn golden EX particle trails
      if (this.isEXActive && this.moveFrame % 3 === 0) {
        this.onSpawnParticles?.('hit-spark-medium', { ...this.body.position, y: this.body.position.y + 1.0 } as any, '#FFAA00')
      }

      // Spawn active attack trails (Street Fighter Style)
      if (this.moveFrame >= this.currentMove.startup && this.moveFrame <= this.currentMove.startup + this.currentMove.active) {
        const isPunch = this.currentMove.id.includes('punch') || this.currentMove.id.includes('jab') || this.currentMove.id.includes('hook') || this.currentMove.id.includes('uppercut')
        const isKick = this.currentMove.id.includes('kick') || this.currentMove.id.includes('sweep') || this.currentMove.id.includes('slide')
        
        let limb: AbstractMesh | null = null
        if (isPunch) {
          limb = this.facingRight ? this.getPart('armR') : this.getPart('armL')
        } else if (isKick) {
          limb = this.facingRight ? this.getPart('legR') : this.getPart('legL')
        }

        if (limb) {
          const absolutePos = limb.getAbsolutePosition()
          this.onSpawnParticles?.('character-aura', absolutePos, this.def.colors.aura)
          if (this.moveFrame % 2 === 0) {
            this.onSpawnParticles?.('hit-spark-light', absolutePos, this.def.colors.primary)
          }
        }
      }
      
      // Spawn projectile on first active frame
      if (this.moveFrame === this.currentMove.startup && this.currentMove.projectile) {
        const spawnPos = {
          x: this.body.position.x + (this.facingRight ? 1 : -1),
          y: this.body.position.y + 1.4,
          z: this.body.position.z
        }
        this.onSpawnProjectile?.(this.currentMove.projectile, spawnPos, this.facingRight)
      }

      const totalFrames = this.currentMove.startup + this.currentMove.active + this.currentMove.recovery
      if (this.moveFrame >= totalFrames) {
        this.currentMove = null
        this.moveFrame = 0
        this.currentAnimation = 'idle'
        this.isEXActive = false
      }
    }
    
    // Process skeletal procedural keyframing
    this.updateProceduralAnimation()
    this.animationTimer++
  }

  private updateProceduralAnimation(): void {
    if (!this.rootNode) return

    // Shimmer effect: pulse the scaling of the rootNode slightly if in Overdrive
    if (this.isOverdriveActive) {
      const pulse = 1.0 + Math.sin(this.animationTimer * 0.28) * 0.04
      this.rootNode.scaling.set(pulse, pulse, pulse)
    } else {
      this.rootNode.scaling.set(1, 1, 1)
    }

    // Get sub-meshes
    const body = this.getPart('body')
    const head = this.getPart('head')
    const legL = this.getPart('legL')
    const legR = this.getPart('legR')
    const armL = this.getPart('armL')
    const armR = this.getPart('armR')

    if (!body || !head || !legL || !legR || !armL || !armR) return

    const isHeavy = this.id === 'iron-claw'
    const defBodyY = isHeavy ? 1.35 : 1.4
    const defHeadY = isHeavy ? 2.15 : 2.2
    const defLegX = isHeavy ? 0.25 : 0.2
    const defArmX = isHeavy ? 0.66 : 0.54

    // 1. Reset standard poses
    body.position.set(0, defBodyY, 0)
    head.position.set(0, defHeadY, 0)
    legL.position.set(-defLegX, 0.4, 0)
    legR.position.set(defLegX, 0.4, 0)
    armL.position.set(-defArmX, 1.5, 0)
    armR.position.set(defArmX, 1.5, 0)

    body.rotation.set(0, 0, 0)
    head.rotation.set(0, 0, 0)
    legL.rotation.set(0, 0, 0)
    legR.rotation.set(0, 0, 0)
    armL.rotation.set(0, 0, 0)
    armR.rotation.set(0, 0, 0)

    // Reset root node tilts
    this.rootNode.rotation.x = 0
    this.rootNode.rotation.z = 0

    // Character specific idle accessories rotations
    this.animateAccessories()

    // 2. Map animations
    const animState = this.currentAnimation

    if (animState === 'idle') {
      const bob = Math.sin(this.animationTimer * 0.05) * 0.03
      body.position.y = defBodyY + bob
      head.position.y = defHeadY + bob
      
      // Arms relaxed
      armL.rotation.z = -0.12 + Math.sin(this.animationTimer * 0.05) * 0.02
      armR.rotation.z = 0.12 - Math.sin(this.animationTimer * 0.05) * 0.02
    } 
    else if (animState === 'walk-forward') {
      const cycle = this.animationTimer * 0.15
      legL.rotation.x = Math.sin(cycle) * 0.5
      legR.rotation.x = -Math.sin(cycle) * 0.5
      
      armL.rotation.x = -Math.sin(cycle) * 0.4
      armR.rotation.x = Math.sin(cycle) * 0.4
      
      body.position.y = defBodyY + Math.abs(Math.sin(cycle * 2)) * 0.05
    } 
    else if (animState === 'walk-backward') {
      const cycle = this.animationTimer * 0.12
      legL.rotation.x = -Math.sin(cycle) * 0.4
      legR.rotation.x = Math.sin(cycle) * 0.4
      
      armL.rotation.x = Math.sin(cycle) * 0.3
      armR.rotation.x = -Math.sin(cycle) * 0.3
      
      body.position.y = defBodyY + Math.abs(Math.sin(cycle * 2)) * 0.04
    } 
    else if (animState === 'jump') {
      armL.rotation.z = -1.1
      armR.rotation.z = 1.1
      legL.rotation.x = 0.3
      legR.rotation.x = 0.3
      legL.position.y = 0.6
      legR.position.y = 0.6
    } 
    else if (animState === 'crouch') {
      body.position.y = defBodyY - 0.3
      head.position.y = defHeadY - 0.3
      legL.position.y = 0.25
      legR.position.y = 0.25
      legL.rotation.x = -0.4
      legR.rotation.x = -0.4
      armL.rotation.z = -0.08
      armR.rotation.z = 0.08
    } 
    else if (animState === 'block' || animState === 'crouch-block') {
      if (animState === 'crouch-block') {
        body.position.y = defBodyY - 0.3
        head.position.y = defHeadY - 0.3
        legL.position.y = 0.25
        legR.position.y = 0.25
        legL.rotation.x = -0.4
        legR.rotation.x = -0.4
      }
      // Shield arm pose
      armL.rotation.set(0.5, 0.7, 0.4)
      armR.rotation.set(0.5, -0.7, -0.4)
    } 
    else if (animState === 'punch-light') {
      const duration = this.currentMove ? (this.currentMove.startup + this.currentMove.active + this.currentMove.recovery) : 10
      const progress = this.moveFrame / duration
      const ext = Math.sin(progress * Math.PI)

      const leadArm = this.facingRight ? armR : armL
      const backArm = this.facingRight ? armL : armR

      leadArm.rotation.x = -Math.PI / 2 * ext
      leadArm.position.z = 0.5 * ext
      backArm.rotation.z = this.facingRight ? -0.2 : 0.2
    } 
    else if (animState === 'punch-heavy') {
      const isHook = this.currentMove?.id === 'punch-hook'
      const duration = this.currentMove ? (this.currentMove.startup + this.currentMove.active + this.currentMove.recovery) : 16
      const progress = this.moveFrame / duration
      const ext = Math.sin(progress * Math.PI)

      if (isHook) {
        // Hook: Rotate torso Y by 45 degrees (0.78 rad) and swing lead arm in arc
        body.rotation.y = (this.facingRight ? 0.78 : -0.78) * ext
        const leadArm = this.facingRight ? armR : armL
        const backArm = this.facingRight ? armL : armR
        
        leadArm.rotation.x = -Math.PI / 2 * ext
        leadArm.rotation.y = (this.facingRight ? -0.5 : 0.5) * ext
        leadArm.position.z = 0.6 * ext
        
        backArm.rotation.z = this.facingRight ? -0.3 : 0.3
      } else {
        body.rotation.y = (this.facingRight ? -0.3 : 0.3) * (1 - ext) + (this.facingRight ? 0.35 : -0.35) * ext
        body.position.z = -0.15 * (1 - ext) + 0.3 * ext

        const leadArm = this.facingRight ? armR : armL
        leadArm.rotation.x = -Math.PI / 1.7 * ext
        leadArm.position.z = 0.65 * ext
      }
    } 
    else if (animState === 'kick-light') {
      const duration = this.currentMove ? (this.currentMove.startup + this.currentMove.active + this.currentMove.recovery) : 12
      const progress = this.moveFrame / duration
      const ext = Math.sin(progress * Math.PI)

      const leadLeg = this.facingRight ? legR : legL
      leadLeg.rotation.x = -Math.PI / 3 * ext
      leadLeg.position.z = 0.25 * ext
    } 
    else if (animState === 'kick-heavy') {
      const duration = this.currentMove ? (this.currentMove.startup + this.currentMove.active + this.currentMove.recovery) : 20
      const progress = this.moveFrame / duration
      const spin = progress * Math.PI * 2
      const ext = Math.sin(progress * Math.PI)

      // Torso spin
      body.rotation.y = this.facingRight ? spin : -spin

      const leadLeg = this.facingRight ? legR : legL
      leadLeg.rotation.x = -Math.PI / 2.2 * ext
      leadLeg.position.y = 0.4 + 0.25 * ext
    } 
    else if (animState.startsWith('special-')) {
      const isUppercut = this.currentMove?.id === 'punch-uppercut'
      const startup = this.currentMove?.startup || 8
      const active = this.currentMove?.active || 4
      const recovery = this.currentMove?.recovery || 6
      const total = startup + active + recovery
      const progress = this.moveFrame / total
      const ext = Math.sin(progress * Math.PI)

      if (isUppercut) {
        // Uppercut: squat down during startup, snap up during active, return during recovery
        const leadArm = this.facingRight ? armR : armL
        if (this.moveFrame <= startup) {
          const factor = this.moveFrame / startup
          body.position.y = defBodyY - 0.3 * factor
          head.position.y = defHeadY - 0.3 * factor
          legL.position.y = 0.4 - 0.1 * factor
          legR.position.y = 0.4 - 0.1 * factor
          leadArm.rotation.x = 0.4 * factor
        } else if (this.moveFrame <= startup + active) {
          const factor = (this.moveFrame - startup) / active
          body.position.y = (defBodyY - 0.3) + (0.6 * factor) // rises to +0.3
          head.position.y = (defHeadY - 0.3) + (0.6 * factor)
          leadArm.rotation.x = -Math.PI * 0.9
          leadArm.position.y = 1.5 + 0.4 * factor
        } else {
          const factor = (this.moveFrame - startup - active) / recovery
          body.position.y = (defBodyY + 0.3) - (0.3 * factor)
          head.position.y = (defHeadY + 0.3) - (0.3 * factor)
          leadArm.rotation.x = (-Math.PI * 0.9) * (1 - factor)
        }
      } else {
        if (this.id === 'kai-storm') {
          const arm = this.facingRight ? armR : armL
          arm.rotation.x = -Math.PI / 2
          arm.position.z = 0.5 * ext
        } 
        else if (this.id === 'viper-x') {
          // Slide pose
          body.position.y = defBodyY - 0.45
          head.position.y = defHeadY - 0.45
          legL.rotation.x = -0.75
          legR.rotation.x = -0.75
        } 
        else if (this.id === 'iron-claw') {
          // Open wide grab
          armL.rotation.set(-0.25 * ext, 0.7 * ext, 0.45 * ext)
          armR.rotation.set(-0.25 * ext, -0.7 * ext, -0.45 * ext)
        } 
        else if (this.id === 'phoenix-rise') {
          body.rotation.x = 0.5 * ext
          armL.rotation.x = 0.75 * ext
          armR.rotation.x = 0.75 * ext
        }
      }
    } 
    else if (animState === 'super') {
      const progress = this.moveFrame / 60
      const ext = Math.sin(progress * Math.PI)

      body.position.y = defBodyY + 1.0 * ext
      head.position.y = defHeadY + 1.0 * ext
      armL.rotation.z = -1.25 * ext
      armR.rotation.z = 1.25 * ext
      legL.rotation.x = 0.35 * ext
      legR.rotation.x = 0.35 * ext
    } 
    else if (animState === 'hit-stun') {
      const hitstun = this.initialHitstun
      if (hitstun <= 15) {
        // Light hit: Flinch arms inward
        body.rotation.x = -0.1
        head.rotation.x = -0.15
        armL.rotation.z = -0.25
        armR.rotation.z = 0.25
        armL.rotation.x = 0.3
        armR.rotation.x = 0.3
      } else if (hitstun <= 25) {
        // Medium hit: Snap head to the side, raise one foot
        body.rotation.x = -0.2
        body.rotation.y = this.facingRight ? -0.25 : 0.25
        head.rotation.y = this.facingRight ? 0.35 : -0.35
        head.rotation.z = -0.15
        const leadLeg = this.facingRight ? legR : legL
        leadLeg.position.y = 0.55
        leadLeg.rotation.x = -0.35
        armL.rotation.z = -0.4
        armR.rotation.z = 0.4
      } else {
        // Heavy hit / Launcher: Arch the spine backward, tilt body
        body.rotation.x = 0.45
        head.rotation.x = 0.35
        body.rotation.z = this.facingRight ? -0.15 : 0.15
        armL.rotation.z = -1.1
        armR.rotation.z = 1.1
        
        if (this.body.isAirborne) {
          if (this.rootNode) {
            this.rootNode.rotation.x = 0.35
          }
          legL.rotation.x = 0.4
          legR.rotation.x = -0.15
        }
      }
    } 
    else if (animState === 'defeat') {
      // Slump on knees
      body.position.y = defBodyY - 0.38
      head.rotation.x = 0.38
      armL.rotation.z = -0.1
      armR.rotation.z = 0.1
      legL.rotation.x = -0.55
      legR.rotation.x = -0.55
    }
    else if (animState === 'victory') {
      // Raised arms and puffed chest
      body.position.y = defBodyY + 0.1
      head.rotation.x = -0.18
      armL.rotation.set(-0.3, 0.4, -2.1)
      armR.rotation.set(-0.3, -0.4, 2.1)
      legL.rotation.x = -0.1
      legR.rotation.x = -0.1
    }
    else if (animState === 'dash-forward') {
      // Torso leans forward, knees bend, arms in
      body.position.y = defBodyY - 0.1
      body.rotation.z = this.facingRight ? 0.35 : -0.35
      legL.rotation.x = 0.22
      legR.rotation.x = 0.22
      armL.rotation.z = -0.3
      armR.rotation.z = 0.3
    }
    else if (animState === 'dash-backward') {
      // Torso leans backward, knees bend, arms in
      body.position.y = defBodyY - 0.08
      body.rotation.z = this.facingRight ? -0.25 : 0.25
      legL.rotation.x = 0.16
      legR.rotation.x = 0.16
      armL.rotation.z = -0.35
      armR.rotation.z = 0.35
    }
    else if (animState === 'knockdown') {
      // Lie flat on back
      body.rotation.z = this.facingRight ? -Math.PI / 2 : Math.PI / 2
      body.position.y = 0.25
      head.position.y = 0.25
      legL.position.y = 0.25
      legR.position.y = 0.25
      armL.position.y = 0.25
      armR.position.y = 0.25
    }
    else if (animState === 'getup') {
      // Smoothly stand up
      const progress = (30 - this.getupTimer) / 30
      body.rotation.z = (this.facingRight ? -Math.PI / 2 : Math.PI / 2) * (1 - progress)
      body.position.y = 0.25 * (1 - progress) + defBodyY * progress
      head.position.y = 0.25 * (1 - progress) + defHeadY * progress
      legL.position.y = 0.25 * (1 - progress) + 0.4 * progress
      legR.position.y = 0.25 * (1 - progress) + 0.4 * progress
      armL.position.y = 0.25 * (1 - progress) + 1.5 * progress
      armR.position.y = 0.25 * (1 - progress) + 1.5 * progress
    }
    else if (animState === 'special-2' && this.id !== 'viper-x' && this.id !== 'kai-storm') {
      // Dodge Roll: Spin 360 around horizontal-facing axis (Z-axis rotation) and dip height
      const duration = this.currentMove ? (this.currentMove.startup + this.currentMove.active + this.currentMove.recovery) : 20
      const progress = this.moveFrame / duration
      const rollAngle = progress * Math.PI * 2
      body.rotation.z = this.facingRight ? -rollAngle : rollAngle
      body.position.y = defBodyY - 0.5 * Math.sin(progress * Math.PI)
    }

    // Update dynamic PBR materials: Damage Hit Flash, Overdrive Glowing Auras, Rim Lighting
    if (this.rootNode) {
      const meshes = this.rootNode.getChildMeshes(false)
      meshes.forEach(mesh => {
        const mat = mesh.material as any
        if (mat) {
          const isGlowMesh = mesh.name === 'visor' || mesh.name === 'katana1' || mesh.name === 'katana2' || 
                             mesh.name === 'tube' || mesh.name === 'canister' || mesh.name === 'halo' || 
                             mesh.name === 'orbL' || mesh.name === 'orbR' || mesh.name === 'star' || 
                             mesh.name === 'shard1' || mesh.name === 'shard2' || mesh.name === 'hornL' || 
                             mesh.name === 'hornR' || mesh.name === 'wingL' || mesh.name === 'wingR'

          if (this.isInHitstun) {
            // Emissive damage white flash
            mat.emissiveColor = new Color3(1, 1, 1)
            mat.emissiveIntensity = 3.0
          } else if (this.isOverdriveActive || this.meter >= 1000) {
            // Overdrive pulsing glow
            const auraColor = Color3.FromHexString(this.def.colors.aura)
            if (isGlowMesh) {
              mat.emissiveColor = auraColor
              mat.emissiveIntensity = 3.5 + Math.sin(this.animationTimer * 0.15) * 1.0
            } else {
              mat.emissiveColor = auraColor
              mat.emissiveIntensity = 0.5 + Math.sin(this.animationTimer * 0.1) * 0.3
            }
          } else {
            // Default clean high-graphics properties
            if (isGlowMesh) {
              mat.emissiveColor = Color3.FromHexString(this.def.colors.aura)
              mat.emissiveIntensity = 2.5
            } else {
              mat.emissiveColor = new Color3(0, 0, 0)
              mat.emissiveIntensity = 0
            }
          }
        }
      })
    }
  }

  private animateAccessories(): void {
    const time = this.animationTimer

    if (this.id === 'nova-star') {
      const orbL = this.getPart('orbL')
      const orbR = this.getPart('orbR')
      if (orbL && orbR) {
        const angle = time * 0.08
        orbL.position.x = -0.6 + Math.sin(angle) * 0.08
        orbL.position.z = Math.cos(angle) * 0.12
        orbR.position.x = 0.6 - Math.sin(angle) * 0.08
        orbR.position.z = -Math.cos(angle) * 0.12
      }

      const halo = this.getPart('halo')
      if (halo) {
        halo.position.y = 0.35 + Math.sin(time * 0.05) * 0.04
      }
    } 
    else if (this.id === 'phoenix-rise') {
      const wingL = this.getPart('wingL')
      const wingR = this.getPart('wingR')
      if (wingL && wingR) {
        const flap = Math.sin(time * 0.06) * 0.12
        wingL.rotation.y = 0.3 + flap
        wingR.rotation.y = -0.3 - flap
      }
    } 
    else if (this.id === 'shadow-byte') {
      const shard1 = this.getPart('shard1')
      const shard2 = this.getPart('shard2')
      if (shard1 && shard2) {
        shard1.position.y = 0.2 + Math.sin(time * 0.09) * 0.05
        shard2.position.y = -0.3 + Math.cos(time * 0.07) * 0.05
      }
    }
  }

  get isDead(): boolean { return this.health <= 0 }
  get isAttacking(): boolean { return this.currentMove !== null }
  get meterPercent(): number { return this.meter / MAX_METER }
  get healthPercent(): number { return this.health / STARTING_HEALTH }
}
