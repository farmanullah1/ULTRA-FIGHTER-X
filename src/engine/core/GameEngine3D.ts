import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, DirectionalLight, ShadowGenerator, DefaultRenderingPipeline, Color4 } from '@babylonjs/core'
import { AssetManager } from './AssetManager'
import { PhysicsEngine } from './PhysicsEngine'
import { CollisionDetector } from './CollisionDetector'
import { InputManager } from './InputManager'
import { GameLoop } from './GameLoop'
import { CharacterBase } from '@engine/characters/CharacterBase'
import type { CharacterDef } from '@game-types/character.types'
import { useGameStore } from '@stores/gameStore'
import { ParticleSystemManager } from '@engine/ParticleSystem'
import { AIController } from '@engine/ai/AIController'
import { AudioManager } from '@engine/audio/AudioManager'

export type BattleState = 'waiting' | 'starting' | 'active' | 'ko' | 'round-end'

export class GameEngine3D {
  private engine: Engine
  private scene: Scene
  private canvas: HTMLCanvasElement
  private gameLoop: GameLoop
  private ai: AIController | null = null
  private audio: AudioManager

  assetManager: AssetManager
  physics: PhysicsEngine
  collision: CollisionDetector
  input: InputManager
  particles: ParticleSystemManager

  player1: CharacterBase | null = null
  player2: CharacterBase | null = null

  camera: ArcRotateCamera | null = null
  shadowGenerator: ShadowGenerator | null = null

  // Match State
  battleState: BattleState = 'waiting'
  roundTime: number = 99
  stateTimer: number = 0

  constructor(canvas: HTMLCanvasElement, inputManager: InputManager) {
    this.canvas = canvas
    this.input = inputManager
    this.engine = new Engine(canvas, true)
    this.scene = new Scene(this.engine)
    this.scene.clearColor = new Color4(0.01, 0.01, 0.03, 1)

    this.assetManager = new AssetManager(this.scene)
    this.physics = new PhysicsEngine()
    this.collision = new CollisionDetector()
    this.gameLoop = new GameLoop()
    this.particles = new ParticleSystemManager(this.scene)
    this.audio = new AudioManager()

    this.initScene()
    this.initPipeline()

    window.addEventListener('resize', () => {
      this.engine.resize()
    })
  }

  private initScene(): void {
    this.camera = new ArcRotateCamera(
      'mainCamera',
      Math.PI / 2,
      Math.PI / 2.2,
      12,
      new Vector3(0, 1.5, 0),
      this.scene
    )
    this.camera.lowerRadiusLimit = 5
    this.camera.upperRadiusLimit = 20
    this.camera.attachControl(this.canvas, true)

    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), this.scene)
    hemiLight.intensity = 0.5

    const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -2, -1), this.scene)
    dirLight.position = new Vector3(20, 40, 20)
    dirLight.intensity = 0.8

    this.shadowGenerator = new ShadowGenerator(1024, dirLight)
    this.shadowGenerator.useBlurExponentialShadowMap = true
  }

  private initPipeline(): void {
    const pipeline = new DefaultRenderingPipeline('defaultPipeline', true, this.scene, [this.camera!])
    pipeline.bloomEnabled = true
    pipeline.bloomThreshold = 0.8
    pipeline.bloomWeight = 0.3
    pipeline.bloomKernel = 64
    pipeline.chromaticAberrationEnabled = true
    pipeline.chromaticAberration.aberrationAmount = 1
    pipeline.samples = 4
  }

  async setupBattle(p1Def: CharacterDef, p2Def: CharacterDef, stageTheme: string): Promise<void> {
    this.assetManager.createStage(stageTheme)

    this.player1 = new CharacterBase(p1Def, -3, true)
    this.player2 = new CharacterBase(p2Def, 3, false)

    const mode = useGameStore.getState().gameMode
    if (mode === 'arcade' || mode === 'survival') {
      this.ai = new AIController('normal')
    }

    const [p1Assets, p2Assets] = await Promise.all([
      this.assetManager.loadCharacterModel(p1Def.modelPath, p1Def.colors.primary),
      this.assetManager.loadCharacterModel(p2Def.modelPath, p2Def.colors.primary)
    ])

    this.player1.rootNode = p1Assets.root
    this.player1.mesh = p1Assets.mesh
    this.player1.animations = p1Assets.animations as any

    this.player2.rootNode = p2Assets.root
    this.player2.mesh = p2Assets.mesh
    this.player2.animations = p2Assets.animations as any

    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(p1Assets.mesh, true)
      this.shadowGenerator.addShadowCaster(p2Assets.mesh, true)
    }
    this.battleState = 'starting'
    this.stateTimer = 180 // 3 seconds at 60fps
    this.roundTime = 99

    this.audio.playMusic('/assets/music/battle_theme.mp3', 0.4)

    this.gameLoop.start(this.update.bind(this), this.render.bind(this))
  }

  private update(_deltaTime: number, frame: number): void {
    if (!this.player1 || !this.player2) return

    this.input.update(frame)

    if (this.battleState === 'starting') {
      this.stateTimer--
      if (this.stateTimer <= 0) {
        this.battleState = 'active'
        useGameStore.getState().setBattleState('active')
      }
    }

    if (this.battleState === 'active') {
      if (frame % 60 === 0 && this.roundTime > 0) {
        this.roundTime--
        useGameStore.getState().updateTimer(this.roundTime)
      }
    }

    const p1Input = this.input.getPlayer1Input()
    let p2Input = this.input.getPlayer2Input()
    
    if (this.ai) {
      p2Input = this.ai.generateInput(this.player2, this.player1, frame)
    }

    // Lock inputs if not active
    const effectiveP1Input = this.battleState === 'active' ? p1Input : this.getEmptyInput()
    const effectiveP2Input = this.battleState === 'active' ? p2Input : this.getEmptyInput()

    if (!this.player1.currentMove && !this.player1.isInHitstun) {
      this.player1.facingRight = this.player1.body.position.x < this.player2.body.position.x
    }
    if (!this.player2.currentMove && !this.player2.isInHitstun) {
      this.player2.facingRight = this.player2.body.position.x < this.player1.body.position.x
    }

    this.player1.update(effectiveP1Input, this.input.getP1Buffer(), frame, this.physics)
    this.player2.update(effectiveP2Input, this.input.getP2Buffer(), frame, this.physics)

    this.checkCollisions(this.player1, this.player2)
    this.checkCollisions(this.player2, this.player1)

    this.physics.resolveOverlap(this.player1.body, this.player2.body)

    // Check for KO
    if (this.battleState === 'active') {
      if (this.player1.isDead || this.player2.isDead || this.roundTime <= 0) {
        this.battleState = 'ko'
        this.stateTimer = 180
        this.gameLoop.setTimeScale(0.2) // Slow mo
        useGameStore.getState().setBattleState('ko')
      }
    }

    if (this.battleState === 'ko') {
      this.stateTimer--
      if (this.stateTimer <= 0) {
        this.battleState = 'round-end'
        this.gameLoop.setTimeScale(1.0)
        useGameStore.getState().setBattleState('round-end')
        
        // Record Round Result
        const winner = this.player1.health > this.player2.health ? 'player1' : 'player2'
        useGameStore.getState().recordRoundResult({
          winner,
          timeLeft: this.roundTime,
          perfectRound: (winner === 'player1' ? this.player1.health : this.player2.health) === 1000
        })
      }
    }

    if (frame % 2 === 0) {
      const store = useGameStore.getState()
      
      if (store.player1ComboTimer > 0) {
        store.player1ComboTimer--
        if (store.player1ComboTimer <= 0) store.resetCombo(1)
      }
      if (store.player2ComboTimer > 0) {
        store.player2ComboTimer--
        if (store.player2ComboTimer <= 0) store.resetCombo(2)
      }

      store.updateHealth(1, this.player1.health)
      store.updateHealth(2, this.player2.health)
      store.updateMeter(1, this.player1.meter)
      store.updateMeter(2, this.player2.meter)
    }

    this.updateCamera()
  }

  private getEmptyInput() {
    return {
      left: false, right: false, up: false, down: false,
      punch: false, kick: false, heavyPunch: false, heavyKick: false,
      special: false, super: false, block: false, dash: false,
    }
  }

  private checkCollisions(attacker: CharacterBase, victim: CharacterBase): void {
    if (!attacker.currentMove || attacker.hasLandedHit) return

    const victimHurtbox = this.collision.getCharacterHurtbox(
      victim.body.position.x, victim.body.position.y, victim.body.position.z,
      victim.body.width, victim.body.height, victim.body.depth
    )

    const hit = this.collision.checkAttackHit(
      attacker.body.position.x, attacker.body.position.y, attacker.body.position.z,
      attacker.facingRight, attacker.currentMove.hitboxes, attacker.moveFrame,
      victimHurtbox, victim.isBlocking
    )

    if (hit) {
      attacker.hasLandedHit = true
      const hitPos = new Vector3((attacker.body.position.x + victim.body.position.x) / 2, attacker.body.position.y + 1.5, 0)
      
      const store = useGameStore.getState()
      const attackerPlayer = attacker === this.player1 ? 1 : 2
      store.incrementCombo(attackerPlayer)

      if (victim.isBlocking) {
        victim.receiveBlock(hit.damage, hit.blockstun)
        this.particles.spawn('block-spark', hitPos, '#FFFFFF')
        this.audio.playSFX('block')
      } else {
        victim.receiveHit(hit.damage, hit.hitstun, hit.knockback)
        this.particles.spawn('hit-spark', hitPos, attacker.def.colors.aura)
        this.audio.playSFX('hit')
      }
      attacker.applyHitstop(6)
      victim.applyHitstop(6)
    }
  }

  private render(_interpolation: number): void { }

  private updateCamera(): void {
    if (!this.player1 || !this.player2 || !this.camera) return
    const p1Pos = this.player1.body.position
    const p2Pos = this.player2.body.position
    const midpointX = (p1Pos.x + p2Pos.x) / 2
    const midpointY = (p1Pos.y + p2Pos.y) / 2 + 1.5
    this.camera.setTarget(new Vector3(midpointX, midpointY, 0))
    const dist = Math.abs(p1Pos.x - p2Pos.x)
    this.camera.radius = Math.max(8, Math.min(dist * 1.5, 18))
  }

  start(): void {
    this.engine.runRenderLoop(() => { this.scene.render() })
  }

  stop(): void {
    this.gameLoop.stop()
    this.engine.stopRenderLoop()
  }

  getScene(): Scene { return this.scene }
}
