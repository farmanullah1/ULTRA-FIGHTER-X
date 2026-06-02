import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, DirectionalLight, ShadowGenerator, DefaultRenderingPipeline, Color4, SSAO2RenderingPipeline, CubeTexture } from '@babylonjs/core'
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
import { Projectile } from './Projectile'

export type BattleState = 'waiting' | 'starting' | 'active' | 'ko' | 'round-end'

export class GameEngine3D {
  private engine: Engine
  private scene: Scene
  private canvas: HTMLCanvasElement
  private gameLoop: GameLoop
  private ai: AIController | null = null
  private audio: AudioManager
  private projectiles: Projectile[] = []

  assetManager: AssetManager
  physics: PhysicsEngine
  collision: CollisionDetector
  input: InputManager
  particles: ParticleSystemManager

  player1: CharacterBase | null = null
  player2: CharacterBase | null = null

  camera: ArcRotateCamera | null = null
  shadowGenerator: ShadowGenerator | null = null

  // Cinematic Camera State
  private shakeTimer: number = 0
  private shakeIntensity: number = 0

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
    try {
      this.scene.environmentTexture = CubeTexture.CreateFromPrefilteredData('/assets/textures/environment.env', this.scene)
    } catch (e) {
      console.warn("Environment texture not found, using default lighting.", e)
    }

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
    hemiLight.intensity = 0.3

    const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -2, -1), this.scene)
    dirLight.position = new Vector3(20, 40, 20)
    dirLight.intensity = 1.0

    this.shadowGenerator = new ShadowGenerator(2048, dirLight)
    this.shadowGenerator.useBlurExponentialShadowMap = true
    this.shadowGenerator.blurKernel = 32
  }

  private initPipeline(): void {
    const pipeline = new DefaultRenderingPipeline('defaultPipeline', true, this.scene, [this.camera!])
    pipeline.bloomEnabled = true
    pipeline.bloomThreshold = 0.8
    pipeline.bloomWeight = 0.4
    pipeline.bloomKernel = 64
    
    pipeline.chromaticAberrationEnabled = true
    pipeline.chromaticAberration.aberrationAmount = 0.5
    
    pipeline.depthOfFieldEnabled = true
    pipeline.depthOfField.focusDistance = 12000
    pipeline.depthOfField.focalLength = 50
    pipeline.depthOfField.fStop = 1.4
    
    pipeline.samples = 4

    const ssao = new SSAO2RenderingPipeline('ssao', this.scene, 0.75, [this.camera!])
    ssao.totalStrength = 1.0
    ssao.radius = 2
  }

  async setupBattle(p1Def: CharacterDef, p2Def: CharacterDef, stageTheme: string): Promise<void> {
    this.assetManager.createStage(stageTheme)

    this.player1 = new CharacterBase(p1Def, -3, true)
    this.player2 = new CharacterBase(p2Def, 3, false)

    const spawnProj = (config: any, pos: any, facingRight: boolean, ownerId: string) => {
      const proj = new Projectile(ownerId, config, new Vector3(pos.x, pos.y, pos.z), facingRight, this.scene, this.particles)
      this.projectiles.push(proj)
      this.audio.playSFX('swing')
    }

    this.player1.onSpawnProjectile = (c, p, f) => spawnProj(c, p, f, 'p1')
    this.player2.onSpawnProjectile = (c, p, f) => spawnProj(c, p, f, 'p2')

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
    this.stateTimer = 180
    this.roundTime = 99
    this.audio.playMusic('/assets/music/battle_theme.mp3', 0.4)
    this.gameLoop.start(this.update.bind(this), this.render.bind(this))
  }

  private update(_deltaTime: number, frame: number): void {
    if (!this.player1 || !this.player2) return

    this.input.update(frame)

    this.projectiles = this.projectiles.filter(p => {
      p.update(this.particles)
      const victim = p.ownerId === 'p1' ? this.player2! : this.player1!
      const victimHurtbox = this.collision.getCharacterHurtbox(victim.body.position.x, victim.body.position.y, victim.body.position.z, victim.body.width, victim.body.height, victim.body.depth)
      const projBox = { min: { x: p.position.x - p.config.width/2, y: p.position.y - p.config.height/2, z: p.position.z - p.config.depth/2 }, max: { x: p.position.x + p.config.width/2, y: p.position.y + p.config.height/2, z: p.position.z + p.config.depth/2 } }

      if (this.collision.boxesOverlap(projBox, victimHurtbox)) {
        if (victim.isBlocking) { victim.receiveBlock(p.config.damage * 0.1, 12); this.audio.playSFX('block'); }
        else { victim.receiveHit(p.config.damage, 20, { x: 0.2, y: 0.1, z: 0 }); this.audio.playSFX('hit'); }
        this.particles.spawn('hit-spark', p.position, p.config.glowColor); this.shakeCamera(0.2, 10); p.dispose(); return false;
      }
      if (p.isDead) { p.dispose(); return false; }
      return true
    })

    if (this.battleState === 'starting') {
      this.stateTimer--; if (this.stateTimer <= 0) { this.battleState = 'active'; useGameStore.getState().setBattleState('active'); }
    }

    if (this.battleState === 'active') {
      if (frame % 60 === 0 && this.roundTime > 0) { this.roundTime--; useGameStore.getState().updateTimer(this.roundTime); }
    }

    const p1Input = this.input.getPlayer1Input()
    let p2Input = this.input.getPlayer2Input()
    if (this.ai) p2Input = this.ai.generateInput(this.player2, this.player1, frame)

    const effectiveP1Input = this.battleState === 'active' ? p1Input : this.getEmptyInput()
    const effectiveP2Input = this.battleState === 'active' ? p2Input : this.getEmptyInput()

    if (!this.player1.currentMove && !this.player1.isInHitstun) this.player1.facingRight = this.player1.body.position.x < this.player2.body.position.x
    if (!this.player2.currentMove && !this.player2.isInHitstun) this.player2.facingRight = this.player2.body.position.x < this.player1.body.position.x

    this.player1.update(effectiveP1Input, this.input.getP1Buffer(), frame, this.physics, this.input)
    this.player2.update(effectiveP2Input, this.input.getP2Buffer(), frame, this.physics, this.input)

    this.checkCollisions(this.player1, this.player2)
    this.checkCollisions(this.player2, this.player1)

    this.physics.resolveOverlap(this.player1.body, this.player2.body)

    if (this.battleState === 'active') {
      if (this.player1.isDead || this.player2.isDead || this.roundTime <= 0) {
        this.battleState = 'ko'; this.stateTimer = 180; this.gameLoop.setTimeScale(0.2); useGameStore.getState().setBattleState('ko')
      }
    }

    if (this.battleState === 'ko') {
      this.stateTimer--; if (this.stateTimer <= 0) {
        this.battleState = 'round-end'; this.gameLoop.setTimeScale(1.0); useGameStore.getState().setBattleState('round-end');
        const winner = this.player1.health > this.player2.health ? 'player1' : 'player2'
        useGameStore.getState().recordRoundResult({ winner, timeLeft: this.roundTime, perfectRound: (winner === 'player1' ? this.player1.health : this.player2.health) === 1000 })
      }
    }

    if (frame % 2 === 0) {
      const store = useGameStore.getState()
      if (store.player1ComboTimer > 0) { store.player1ComboTimer--; if (store.player1ComboTimer <= 0) store.resetCombo(1); }
      if (store.player2ComboTimer > 0) { store.player2ComboTimer--; if (store.player2ComboTimer <= 0) store.resetCombo(2); }
      store.updateHealth(1, this.player1.health); store.updateHealth(2, this.player2.health);
      store.updateMeter(1, this.player1.meter); store.updateMeter(2, this.player2.meter);
    }

    this.updateCamera()
  }

  private getEmptyInput() {
    return { left: false, right: false, up: false, down: false, punch: false, kick: false, heavyPunch: false, heavyKick: false, special: false, super: false, block: false, dash: false }
  }

  private checkCollisions(attacker: CharacterBase, victim: CharacterBase): void {
    if (!attacker.currentMove || attacker.hasLandedHit) return
    const victimHurtbox = this.collision.getCharacterHurtbox(victim.body.position.x, victim.body.position.y, victim.body.position.z, victim.body.width, victim.body.height, victim.body.depth)
    const hit = this.collision.checkAttackHit(attacker.body.position.x, attacker.body.position.y, attacker.body.position.z, attacker.facingRight, attacker.currentMove.hitboxes, attacker.moveFrame, victimHurtbox, victim.isBlocking)

    if (hit) {
      attacker.hasLandedHit = true
      const hitPos = new Vector3((attacker.body.position.x + victim.body.position.x) / 2, attacker.body.position.y + 1.5, 0)
      const store = useGameStore.getState()
      store.incrementCombo(attacker === this.player1 ? 1 : 2)
      if (victim.isBlocking) { victim.receiveBlock(hit.damage, hit.blockstun); this.audio.playSFX('block'); }
      else { victim.receiveHit(hit.damage, hit.hitstun, hit.knockback); this.particles.spawn('hit-spark', hitPos, attacker.def.colors.aura); this.audio.playSFX('hit'); }
      attacker.applyHitstop(6); victim.applyHitstop(6);
    }
  }

  shakeCamera(intensity: number, duration: number): void {
    this.shakeIntensity = intensity
    this.shakeTimer = duration
  }

  private updateCamera(): void {
    if (!this.player1 || !this.player2 || !this.camera) return
    const midpointX = (this.player1.body.position.x + this.player2.body.position.x) / 2
    const midpointY = (this.player1.body.position.y + this.player2.body.position.y) / 2 + 1.5
    const targetPos = new Vector3(midpointX, midpointY, 0)

    if (this.shakeTimer > 0) {
      targetPos.x += (Math.random() - 0.5) * this.shakeIntensity
      targetPos.y += (Math.random() - 0.5) * this.shakeIntensity
      this.shakeTimer--
    }
    this.camera.setTarget(targetPos)
    const dist = Math.abs(this.player1.body.position.x - this.player2.body.position.x)
    this.camera.radius = Math.max(8, Math.min(dist * 1.5, 18))
  }

  private render(_interpolation: number): void { }

  start(): void { this.engine.runRenderLoop(() => { this.scene.render() }) }
  stop(): void { this.gameLoop.stop(); this.engine.stopRenderLoop() }
  getScene(): Scene { return this.scene }
}
