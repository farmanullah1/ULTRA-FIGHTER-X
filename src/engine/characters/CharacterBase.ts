import { PhysicsEngine, type PhysicsBody } from '@engine/core/PhysicsEngine'
import type { CharacterDef, AnimationState, Move } from '@game-types/character.types'
import type { InputState } from '@game-types/input.types'
import type { InputBuffer } from '@game-types/input.types'
import { STARTING_HEALTH, MAX_METER } from '@constants/gameConstants'
import { TransformNode, AbstractMesh, AnimationGroup } from '@babylonjs/core'
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
  crouchDashTimer: number = 0
  isParrying: boolean = false
  parryTimer: number = 0
  isBeingThrown: boolean = false
  throwBreakTimer: number = 0
  throwBreakPressed: boolean = false
  justQuickShifted: boolean = false
  quickShiftVFXTimer: number = 0

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
  onSuperFlash: (() => void) | null = null

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

    // Update 3D fighter timers & velocities
    if (this.sidestepTimer > 0) {
      this.sidestepTimer--
      this.body.velocity.z = this.sidestepDir * 0.15
      if (this.sidestepTimer === 0) {
        this.body.velocity.z = 0
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
      if (this.getupTimer === 0) {
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

    if (!isStunned && !this.isKnockedDown) {
      this.processInput(input, inputBuffer, frame, physics, inputManager)
    }
    
    // Adjust height dynamically for crouching / crouch-dashing to dodge highs
    const isCrouchedState = this.currentAnimation === 'crouch' || 
                            this.currentAnimation === 'crouch-block' ||
                            this.crouchDashTimer > 0
    this.body.height = isCrouchedState ? 1.1 : 2.5

    physics.update(this.body)
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
    physics: PhysicsEngine,
    inputManager: any
  ): void {
    const { walkSpeed, jumpHeight } = this.def.stats

    if (this.currentMove) return

    // 1. Throws (Light Punch + Light Kick: punch && kick)
    if (input.punch && input.kick && this.body.isGrounded) {
      this.triggerAttack('throw', frame)
      return
    }

    // 2. Parry / Guard Impact (Light Punch + Block: punch && block)
    if (input.punch && input.block && this.body.isGrounded) {
      this.isParrying = true
      this.parryTimer = 10
      this.currentAnimation = 'block'
      return
    }

    // 3. Sidestepping (Double Tap Up or Down)
    if (this.body.isGrounded) {
      if (this.checkDoubleTap(buffer, 'up')) {
        this.sidestepTimer = 12
        this.sidestepDir = 1
        return
      }
      if (this.checkDoubleTap(buffer, 'down')) {
        this.sidestepTimer = 12
        this.sidestepDir = -1
        return
      }
    }

    // 4. Crouch Dash (F, D, DF sequence or crouch + dash)
    if (this.body.isGrounded) {
      const isFacingRight = this.facingRight
      const forwardSeq = isFacingRight ? ['F', 'D', 'DF'] : ['B', 'D', 'DB']
      const isCrouching = input.down || this.currentAnimation === 'crouch'
      if ((isCrouching && input.dash) || inputManager.checkInputSequence(buffer, forwardSeq)) {
        this.crouchDashTimer = 15
        this.body.velocity.x = (isFacingRight ? 1 : -1) * walkSpeed * 2.2
        this.currentAnimation = 'crouch'
        return
      }
    }

    // 5. Special Moves check (highest precedence after throws/parries/movement)
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

    // Jump / Hop
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

  private checkDoubleTap(buffer: InputBuffer, direction: 'up' | 'down'): boolean {
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

  triggerAttack(type: string, _frame: number): void {
    const move = type === 'throw'
      ? {
          id: 'throw', name: 'Standard Throw', input: 'LP+LK', inputSequence: [], damage: 120, meterGain: 20, meterCost: 0, cancelable: false, invincible: false, startup: 6, active: 4, recovery: 22, onHit: 0, onBlock: 0, animationState: 'punch-heavy', type: 'throw',
          hitboxes: [{ frameStart: 6, frameEnd: 10, x: 0.4, y: 1.0, z: 0, width: 0.8, height: 0.8, depth: 0.8, type: 'throw', damage: 120, knockback: { x: 0.4, y: 0.3, z: 0 } }]
        } as Move
      : (type === 'kick-wakeup'
        ? {
            id: 'kick-wakeup', name: 'Wakeup Kick', input: 'K', inputSequence: [], damage: 45, meterGain: 15, meterCost: 0, cancelable: false, invincible: false, startup: 6, active: 4, recovery: 15, onHit: 12, onBlock: -4, animationState: 'kick-light', type: 'light-kick',
            hitboxes: [{ frameStart: 6, frameEnd: 10, x: 0.5, y: 0.2, z: 0, width: 0.8, height: 0.3, depth: 0.6, type: 'attack', damage: 45, knockback: { x: 0.4, y: 0.1, z: 0 } }]
          } as Move
        : this.def.moves.find(m => m.id === type))

    if (move && !this.currentMove) {
      // Check Meter Cost
      if (move.meterCost > 0 && this.meter < move.meterCost) return

      this.meter -= move.meterCost
      this.currentMove = move
      this.moveFrame = 0
      this.hasLandedHit = false
      this.currentAnimation = move.animationState
      
      // Signal Super Flash
      if (move.type === 'super') {
        this.onSuperFlash?.()
      }
    }
  }

  receiveHit(damage: number, hitstun: number, knockback: { x: number; y: number; z: number }): void {
    this.health = Math.max(0, this.health - damage)
    this.hitstunTimer = hitstun
    this.isInHitstun = true
    this.currentMove = null
    this.isBlocking = false
    this.body.velocity.x = knockback.x * (this.facingRight ? -1 : 1)
    this.body.velocity.y = knockback.y
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
    this.meter = Math.min(MAX_METER, this.meter + 10)
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
      }
    }
    
    // Process skeletal procedural keyframing
    this.updateProceduralAnimation()
    this.animationTimer++
  }

  private updateProceduralAnimation(): void {
    if (!this.rootNode) return

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
      const duration = this.currentMove ? (this.currentMove.startup + this.currentMove.active + this.currentMove.recovery) : 16
      const progress = this.moveFrame / duration
      const ext = Math.sin(progress * Math.PI)

      body.rotation.y = (this.facingRight ? -0.3 : 0.3) * (1 - ext) + (this.facingRight ? 0.35 : -0.35) * ext
      body.position.z = -0.15 * (1 - ext) + 0.3 * ext

      const leadArm = this.facingRight ? armR : armL
      leadArm.rotation.x = -Math.PI / 1.7 * ext
      leadArm.position.z = 0.65 * ext
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
      const progress = this.moveFrame / 24
      const ext = Math.sin(progress * Math.PI)

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
      body.rotation.x = -0.28
      head.rotation.x = -0.38
      armL.rotation.z = -0.55
      armR.rotation.z = 0.55
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
