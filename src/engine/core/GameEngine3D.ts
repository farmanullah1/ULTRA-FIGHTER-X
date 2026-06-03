import { 
  Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, DirectionalLight, 
  ShadowGenerator, DefaultRenderingPipeline, Color4, SSAO2RenderingPipeline, 
  CubeTexture, MeshBuilder, StandardMaterial, Color3, AbstractMesh 
} from '@babylonjs/core'
import { AssetManager } from './AssetManager'
import { PhysicsEngine } from './PhysicsEngine'
import { CollisionDetector } from './CollisionDetector'
import { InputManager } from './InputManager'
import { GameLoop } from './GameLoop'
import { CharacterBase } from '@engine/characters/CharacterBase'
import type { CharacterDef } from '@game-types/character.types'
import { useGameStore } from '@stores/gameStore'
import { useSettingsStore } from '@stores/settingsStore'
import { ParticleSystemManager } from '@engine/ParticleSystem'
import { AIController } from '@engine/ai/AIController'
import { audioManager } from '@engine/audio/AudioManager'
import { Projectile } from './Projectile'
import { STAGES } from '@constants/stages'

export type BattleState = 'waiting' | 'starting' | 'active' | 'ko' | 'round-end'

export class GameEngine3D {
  private engine: Engine
  private scene: Scene
  private canvas: HTMLCanvasElement
  private gameLoop: GameLoop
  private p1AI: AIController | null = null
  private p2AI: AIController | null = null
  private projectiles: Projectile[] = []

  assetManager: AssetManager
  physics: PhysicsEngine
  collision: CollisionDetector
  input: InputManager
  particles: ParticleSystemManager
  audio = audioManager

  player1: CharacterBase | null = null
  player2: CharacterBase | null = null

  camera: ArcRotateCamera | null = null
  shadowGenerator: ShadowGenerator | null = null
  
  // Post-processing pipeline refs for graphics scaling
  private defaultPipeline: DefaultRenderingPipeline | null = null
  private ssaoPipeline: SSAO2RenderingPipeline | null = null
  private currentGraphicsQuality: 'low' | 'medium' | 'ultra' | null = null

  // Visual Hitbox Overlay maps
  private debugHitboxes: Map<string, AbstractMesh> = new Map()

  // Cinematic Camera State
  private shakeTimer: number = 0
  private shakeIntensity: number = 0
  private superFlashTimer: number = 0
  private isSuperFlashActive: boolean = false

  // Match State
  battleState: BattleState = 'waiting'
  roundTime: number = 99
  stateTimer: number = 0

  // Sound triggering trackers
  private lastP1MoveId: string | null = null
  private lastP2MoveId: string | null = null

  // 3D Fighter upgrades tracking
  private cpuRecoveryActive: boolean = false
  private counterFlashTimer: number = 0

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

    this.initScene()
    this.initPipeline()

    window.addEventListener('resize', () => {
      this.engine.resize()
    })

    const resizeObserver = new ResizeObserver(() => {
      this.engine.resize()
    })
    resizeObserver.observe(canvas)

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && useGameStore.getState().screen === 'battle') {
        const current = useGameStore.getState().isPaused
        useGameStore.getState().setPaused(!current)
      }
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
    this.camera.lowerRadiusLimit = 4
    this.camera.upperRadiusLimit = 20
    this.camera.attachControl(this.canvas, true)

    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), this.scene)
    hemiLight.intensity = 0.35

    const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -2, -1), this.scene)
    dirLight.position = new Vector3(20, 40, 20)
    dirLight.intensity = 1.2

    this.shadowGenerator = new ShadowGenerator(2048, dirLight)
    this.shadowGenerator.useBlurExponentialShadowMap = true
    this.shadowGenerator.blurKernel = 32
  }

  private initPipeline(): void {
    this.defaultPipeline = new DefaultRenderingPipeline('defaultPipeline', true, this.scene, [this.camera!])
    this.defaultPipeline.bloomEnabled = true
    this.defaultPipeline.bloomThreshold = 0.8
    this.defaultPipeline.bloomWeight = 0.4
    this.defaultPipeline.bloomKernel = 64
    
    this.defaultPipeline.chromaticAberrationEnabled = true
    this.defaultPipeline.chromaticAberration.aberrationAmount = 0.5
    
    this.defaultPipeline.depthOfFieldEnabled = true
    this.defaultPipeline.depthOfField.focusDistance = 12000
    this.defaultPipeline.depthOfField.focalLength = 50
    this.defaultPipeline.depthOfField.fStop = 1.4
    
    this.defaultPipeline.samples = 4

    this.ssaoPipeline = new SSAO2RenderingPipeline('ssao', this.scene, 0.75, [this.camera!])
    this.ssaoPipeline.totalStrength = 1.0
    this.ssaoPipeline.radius = 2

    // Apply active quality state
    const quality = useSettingsStore.getState().graphicsQuality
    this.applyGraphicsQuality(quality)
  }

  private applyGraphicsQuality(quality: 'low' | 'medium' | 'ultra'): void {
    this.currentGraphicsQuality = quality
    
    if (!this.defaultPipeline || !this.camera) return

    // 1. Shadows configuration
    if (this.shadowGenerator) {
      const dirLight = this.scene.getLightByName('dirLight')
      if (dirLight) {
        if (quality === 'low') {
          dirLight.intensity = 0.7
          this.shadowGenerator.useBlurExponentialShadowMap = false
          this.shadowGenerator.blurKernel = 0
          this.shadowGenerator.getShadowMap()?.resize(512)
        } else if (quality === 'medium') {
          dirLight.intensity = 1.1
          this.shadowGenerator.useBlurExponentialShadowMap = true
          this.shadowGenerator.blurKernel = 16
          this.shadowGenerator.getShadowMap()?.resize(1024)
        } else {
          dirLight.intensity = 1.3
          this.shadowGenerator.useBlurExponentialShadowMap = true
          this.shadowGenerator.blurKernel = 32
          this.shadowGenerator.getShadowMap()?.resize(2048)
        }
      }
    }

    // 2. Anti-aliasing samples
    this.defaultPipeline.samples = quality === 'low' ? 1 : (quality === 'medium' ? 2 : 4)

    // 3. Bloom & Chromatic Aberration
    this.defaultPipeline.bloomEnabled = quality !== 'low'
    this.defaultPipeline.chromaticAberrationEnabled = quality === 'ultra'

    // 4. Depth of Field
    this.defaultPipeline.depthOfFieldEnabled = quality === 'ultra'

    // 5. SSAO
    if (this.ssaoPipeline) {
      if (quality === 'ultra') {
        this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline('ssao', this.camera!)
      } else {
        this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline('ssao', this.camera!)
      }
    }
  }

  async setupBattle(p1Def: CharacterDef, p2Def: CharacterDef, stageTheme: string): Promise<void> {
    this.audio.resume()
    this.assetManager.createStage(stageTheme)

    // Set stage boundaries on physics engine
    const stage = STAGES.find(s => s.id === stageTheme || s.theme === stageTheme) || STAGES[0]
    this.physics.bounds = stage.bounds
    this.physics.isRingOut = stage.isRingOut

    this.player1 = new CharacterBase(p1Def, -3, true)
    this.player2 = new CharacterBase(p2Def, 3, false)

    const spawnProj = (config: any, pos: any, facingRight: boolean, ownerId: string) => {
      const proj = new Projectile(ownerId, config, new Vector3(pos.x, pos.y, pos.z), facingRight, this.scene, this.particles)
      this.projectiles.push(proj)
      this.audio.playSFX('swing')
    }

    this.player1.onSpawnProjectile = (c, p, f) => spawnProj(c, p, f, 'p1')
    this.player2.onSpawnProjectile = (c, p, f) => spawnProj(c, p, f, 'p2')
    
    this.player1.onSuperFlash = () => this.triggerSuperFlash(this.player1!)
    this.player2.onSuperFlash = () => this.triggerSuperFlash(this.player2!)

    const storeState = useGameStore.getState()
    
    // Attract mode vs. Play modes AI config
    if (storeState.gameMode === 'attract') {
      this.p1AI = new AIController('normal')
      this.p2AI = new AIController('normal')
    } else {
      this.p1AI = null
      if (storeState.gameMode === 'arcade' || storeState.gameMode === 'survival') {
        this.p2AI = new AIController('normal')
      } else {
        this.p2AI = null
      }
    }

    const [p1Assets, p2Assets] = await Promise.all([
      this.assetManager.loadCharacterModel(p1Def.modelPath, p1Def),
      this.assetManager.loadCharacterModel(p2Def.modelPath, p2Def)
    ])

    this.player1.rootNode = p1Assets.root
    this.player1.mesh = p1Assets.mesh
    this.player1.animations = p1Assets.animations as any

    this.player2.rootNode = p2Assets.root
    this.player2.mesh = p2Assets.mesh
    this.player2.animations = p2Assets.animations as any

    if (this.shadowGenerator) {
      if (useSettingsStore.getState().graphicsQuality !== 'low') {
        this.shadowGenerator.addShadowCaster(p1Assets.mesh, true)
        this.shadowGenerator.addShadowCaster(p2Assets.mesh, true)
      }
    }

    this.battleState = 'starting'
    this.stateTimer = 180
    this.roundTime = 99
    
    // Wire up initial volumes and loop music
    const sfxVol = useSettingsStore.getState().sfxVolume
    const musicVol = useSettingsStore.getState().musicVolume
    this.audio.setVolume('sfx', sfxVol)
    this.audio.setVolume('music', musicVol)
    
    if (storeState.gameMode === 'attract') {
      this.audio.startMenuMusic()
    } else {
      this.audio.startBattleMusic(stageTheme)
    }

    this.gameLoop.start(this.update.bind(this), this.render.bind(this))
  }

  private triggerSuperFlash(character: CharacterBase): void {
    this.isSuperFlashActive = true
    this.superFlashTimer = 60
    
    this.scene.lights.forEach(l => { if (l.name !== 'hemiLight') l.intensity *= 0.2 })
    
    this.audio.playSFX('super_activate')
    this.particles.spawn('super-explosion', character.body.position as any, character.def.colors.aura)
    this.shakeCamera(0.5, 30)

    // Trigger haptic rumble on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100])
    }
  }

  private update(_deltaTime: number, frame: number): void {
    if (!this.player1 || !this.player2) return

    if (useGameStore.getState().isPaused) return

    // Apply graphics settings updates in real time
    const quality = useSettingsStore.getState().graphicsQuality
    if (this.currentGraphicsQuality !== quality) {
      this.applyGraphicsQuality(quality)
    }

    // Dynamic Volume Update
    const sfxVol = useSettingsStore.getState().sfxVolume
    const musicVol = useSettingsStore.getState().musicVolume
    this.audio.setVolume('sfx', sfxVol)
    this.audio.setVolume('music', this.battleState === 'ko' ? musicVol * 0.12 : musicVol) // Dramatically quiet music during KO

    // Handle Counter-Hit White Flash
    if (this.counterFlashTimer > 0) {
      this.counterFlashTimer--
      const hemi = this.scene.getLightByName('hemiLight')
      if (hemi) {
        hemi.intensity = 3.0
      }
      if (this.counterFlashTimer <= 0) {
        const hemiRestored = this.scene.getLightByName('hemiLight')
        if (hemiRestored) {
          hemiRestored.intensity = 0.35
        }
      }
    }

    this.input.update(frame)

    // Handle Super Flash
    if (this.superFlashTimer > 0) {
      this.superFlashTimer--
      if (this.superFlashTimer <= 0) {
        this.isSuperFlashActive = false
        this.scene.lights.forEach(l => { if (l.name !== 'hemiLight') l.intensity *= 5 })
      }
      this.updateCamera()
      return
    }

    // Play swing sound effects when moves start
    if (this.player1.currentMove && this.player1.moveFrame === 1 && this.player1.currentMove.id !== this.lastP1MoveId) {
      this.lastP1MoveId = this.player1.currentMove.id
      if (this.player1.currentMove.type === 'special') {
        this.audio.playSpecial(this.player1.id)
      } else if (this.player1.currentMove.type === 'super') {
        this.audio.playSFX('super_activate')
      } else {
        const moveId = this.player1.currentMove.id
        let volumeScale = 1.0
        if (moveId === 'punch-light') volumeScale = 0.5
        else if (moveId === 'punch-hook') volumeScale = 1.0
        else if (moveId === 'punch-uppercut') volumeScale = 1.4
        this.audio.playSFX('swing', volumeScale)
      }
    }
    if (!this.player1.currentMove) {
      this.lastP1MoveId = null
    }

    if (this.player2.currentMove && this.player2.moveFrame === 1 && this.player2.currentMove.id !== this.lastP2MoveId) {
      this.lastP2MoveId = this.player2.currentMove.id
      if (this.player2.currentMove.type === 'special') {
        this.audio.playSpecial(this.player2.id)
      } else if (this.player2.currentMove.type === 'super') {
        this.audio.playSFX('super_activate')
      } else {
        const moveId = this.player2.currentMove.id
        let volumeScale = 1.0
        if (moveId === 'punch-light') volumeScale = 0.5
        else if (moveId === 'punch-hook') volumeScale = 1.0
        else if (moveId === 'punch-uppercut') volumeScale = 1.4
        this.audio.playSFX('swing', volumeScale)
      }
    }
    if (!this.player2.currentMove) {
      this.lastP2MoveId = null
    }

    // Update projectiles
    this.projectiles = this.projectiles.filter(p => {
      p.update(this.particles)
      const victim = p.ownerId === 'p1' ? this.player2! : this.player1!
      const victimHurtbox = this.collision.getCharacterHurtbox(victim.body.position.x, victim.body.position.y, victim.body.position.z, victim.body.width, victim.body.height, victim.body.depth)
      const projBox = { min: { x: p.position.x - p.config.width/2, y: p.position.y - p.config.height/2, z: p.position.z - p.config.depth/2 }, max: { x: p.position.x + p.config.width/2, y: p.position.y + p.config.height/2, z: p.position.z + p.config.depth/2 } }

      if (this.collision.boxesOverlap(projBox, victimHurtbox)) {
        if (victim.isBlocking) { 
          victim.receiveBlock(p.config.damage * 0.1, 12)
          this.audio.playSFX('block')
        }
        else { 
          victim.receiveHit(p.config.damage, 20, { x: 0.2, y: 0.1, z: 0 })
          this.audio.playSFX('hit')
          if ('vibrate' in navigator) navigator.vibrate(40)
        }
        this.particles.spawn('hit-spark', p.position, p.config.glowColor)
        this.shakeCamera(0.2, 10)
        p.dispose()
        return false
      }
      if (p.isDead) { p.dispose(); return false; }
      return true
    })

    if (this.battleState === 'starting') {
      this.stateTimer--
      if (this.stateTimer === 120) {
        this.audio.playSFX('round_start')
      }
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

    const storeState = useGameStore.getState()
    let p1Input = this.input.getPlayer1Input()
    let p2Input = this.input.getPlayer2Input()

    // Attract mode or play mode routing
    if (storeState.gameMode === 'attract') {
      p1Input = this.p1AI ? this.p1AI.generateInput(this.player1, this.player2, frame) : this.getEmptyInput()
      p2Input = this.p2AI ? this.p2AI.generateInput(this.player2, this.player1, frame) : this.getEmptyInput()
    } else if (storeState.gameMode === 'training') {
      p2Input = this.getEmptyInput()
      const dummyMode = storeState.dummyMode
      if (dummyMode === 'block') {
        p2Input[this.player2.facingRight ? 'left' : 'right'] = true
      } else if (dummyMode === 'crouch') {
        p2Input.down = true
      } else if (dummyMode === 'crouch-block') {
        p2Input.down = true
        p2Input[this.player2.facingRight ? 'left' : 'right'] = true
      } else if (dummyMode === 'cpu') {
        if (!this.p2AI) this.p2AI = new AIController('normal')
        p2Input = this.p2AI.generateInput(this.player2, this.player1, frame)
      }
    } else {
      if (this.p2AI) p2Input = this.p2AI.generateInput(this.player2, this.player1, frame)
    }

    // Refill training bars
    if (storeState.gameMode === 'training' && storeState.trainingRefill) {
      if (storeState.player1Combo === 0 && storeState.player2Combo === 0) {
        if (this.player1.health < 1000) { this.player1.health = 1000; storeState.updateHealth(1, 1000); }
        if (this.player2.health < 1000) { this.player2.health = 1000; storeState.updateHealth(2, 1000); }
        if (this.player1.meter < 1000) { this.player1.meter = 1000; storeState.updateMeter(1, 1000); }
        if (this.player2.meter < 1000) { this.player2.meter = 1000; storeState.updateMeter(2, 1000); }
      }
    }

    const effectiveP1Input = this.battleState === 'active' ? p1Input : this.getEmptyInput()
    const effectiveP2Input = this.battleState === 'active' ? p2Input : this.getEmptyInput()

    if (!this.player1.currentMove && !this.player1.isInHitstun) this.player1.facingRight = this.player1.body.position.x < this.player2.body.position.x
    if (!this.player2.currentMove && !this.player2.isInHitstun) this.player2.facingRight = this.player2.body.position.x < this.player1.body.position.x

    this.player1.update(effectiveP1Input, this.input.getP1Buffer(), frame, this.physics, this.input, this.player2.body.position)
    this.player2.update(effectiveP2Input, this.input.getP2Buffer(), frame, this.physics, this.input, this.player1.body.position)

    // Spawn Overdrive aura particles
    if (frame % 5 === 0) {
      if (this.player1.isOverdriveActive) {
        this.particles.spawn('hit-spark', this.player1.body.position as any, this.player1.def.colors.aura)
      }
      if (this.player2.isOverdriveActive) {
        this.particles.spawn('hit-spark', this.player2.body.position as any, this.player2.def.colors.aura)
      }
    }

    // Trigger Quick Shift Cancel Visuals
    if (this.player1.justQuickShifted) {
      this.particles.spawn('hit-spark', this.player1.body.position as any, '#FFFFFF')
      this.audio.playSFX('swing')
    }
    if (this.player2.justQuickShifted) {
      this.particles.spawn('hit-spark', this.player2.body.position as any, '#FFFFFF')
      this.audio.playSFX('swing')
    }

    // Resolve Whiffs
    if (this.player1.currentMove && this.player1.moveFrame === this.player1.currentMove.startup + this.player1.currentMove.active) {
      if (!this.player1.hasLandedHit) {
        const moveId = this.player1.currentMove.id
        let volumeScale = 1.0
        if (moveId === 'punch-light') volumeScale = 0.5
        else if (moveId === 'punch-hook') volumeScale = 1.0
        else if (moveId === 'punch-uppercut') volumeScale = 1.4
        this.audio.playSFX('swing', volumeScale)
      }
    }
    if (this.player2.currentMove && this.player2.moveFrame === this.player2.currentMove.startup + this.player2.currentMove.active) {
      if (!this.player2.hasLandedHit) {
        const moveId = this.player2.currentMove.id
        let volumeScale = 1.0
        if (moveId === 'punch-light') volumeScale = 0.5
        else if (moveId === 'punch-hook') volumeScale = 1.0
        else if (moveId === 'punch-uppercut') volumeScale = 1.4
        this.audio.playSFX('swing', volumeScale)
      }
    }

    // Resolve Throw Break triggers
    if (this.player1.isBeingThrown && this.player1.throwBreakPressed) {
      this.resolveThrowBreak(this.player1)
    }
    if (this.player2.isBeingThrown && this.player2.throwBreakPressed) {
      this.resolveThrowBreak(this.player2)
    }
    if (this.player1.isBeingThrown && this.player1.throwBreakTimer === 0) {
      this.resolveThrowSuccess(this.player1)
    }
    if (this.player2.isBeingThrown && this.player2.throwBreakTimer === 0) {
      this.resolveThrowSuccess(this.player2)
    }

    this.checkCollisions(this.player1, this.player2)
    this.checkCollisions(this.player2, this.player1)

    this.physics.resolveOverlap(this.player1.body, this.player2.body)

    // Resolve Wall Splats during hitstun
    if (this.player1.isInHitstun && this.player1.body.hitWall) {
      this.player1.hitstunTimer = 45
      this.player1.body.velocity.x = this.player1.facingRight ? 0.05 : -0.05
      this.player1.body.velocity.z = 0
      this.player1.body.hitWall = null
      this.audio.playSFX('super_impact')
      this.particles.spawn('hit-spark', new Vector3(this.player1.body.position.x, this.player1.body.position.y + 1.2, this.player1.body.position.z), this.player1.def.colors.primary)
      useGameStore.getState().setCustomBannerText("WALL SPLAT!")
      setTimeout(() => useGameStore.getState().setCustomBannerText(null), 1200)
    }
    if (this.player2.isInHitstun && this.player2.body.hitWall) {
      this.player2.hitstunTimer = 45
      this.player2.body.velocity.x = this.player2.facingRight ? 0.05 : -0.05
      this.player2.body.velocity.z = 0
      this.player2.body.hitWall = null
      this.audio.playSFX('super_impact')
      this.particles.spawn('hit-spark', new Vector3(this.player2.body.position.x, this.player2.body.position.y + 1.2, this.player2.body.position.z), this.player2.def.colors.primary)
      useGameStore.getState().setCustomBannerText("WALL SPLAT!")
      setTimeout(() => useGameStore.getState().setCustomBannerText(null), 1200)
    }

    // Visual hitbox overlay update
    this.updateHitboxVisualization()

    // Resolve Ring Outs
    const p1RingOut = this.player1.body.position.y < -4
    const p2RingOut = this.player2.body.position.y < -4
    if (this.battleState === 'active' && (p1RingOut || p2RingOut)) {
      this.battleState = 'ko'
      this.stateTimer = 180
      this.gameLoop.setTimeScale(0.18)
      useGameStore.getState().setBattleState('ko')
      
      if (p1RingOut) this.player1.health = 0
      else this.player2.health = 0
      
      useGameStore.getState().setCustomBannerText("RING OUT!")
      this.audio.playSFX('ko')
      this.shakeCamera(0.6, 25)
      this.player1.body.isFrozen = true
      this.player2.body.isFrozen = true
    }

    if (this.battleState === 'active') {
      if (this.player1.isDead || this.player2.isDead || this.roundTime <= 0) {
        this.battleState = 'ko'
        this.stateTimer = 180
        this.gameLoop.setTimeScale(0.18) // High quality slow motion
        useGameStore.getState().setBattleState('ko')
        this.audio.playSFX('ko')
        this.shakeCamera(0.6, 25)
        
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 300])
        }
      }
    }

    if (this.battleState === 'ko') {
      this.stateTimer--
      if (this.stateTimer <= 0) {
        this.battleState = 'round-end'
        this.gameLoop.setTimeScale(1.0)
        useGameStore.getState().setBattleState('round-end')
        const store = useGameStore.getState()
        const winner = this.player1.health > this.player2.health ? 'player1' : 'player2'
        store.recordRoundResult({ winner, timeLeft: this.roundTime, perfectRound: (winner === 'player1' ? this.player1.health : this.player2.health) === 1000 })

        if (storeState.gameMode === 'attract') {
          setTimeout(() => {
            if (useGameStore.getState().gameMode === 'attract') {
              store.roundsWon.player1 = 0
              store.roundsWon.player2 = 0
            }
            this.resetForNextRound()
          }, 3000)
        } else if (store.roundsWon.player1 < 2 && store.roundsWon.player2 < 2) {
          setTimeout(() => this.resetForNextRound(), 2000)
        }
      }
    }

    if (frame % 2 === 0) {
      const store = useGameStore.getState()
      if (store.player1ComboTimer > 0) { store.player1ComboTimer--; if (store.player1ComboTimer <= 0) store.resetCombo(1); }
      if (store.player2ComboTimer > 0) { store.player2ComboTimer--; if (store.player2ComboTimer <= 0) store.resetCombo(2); }
      store.updateHealth(1, this.player1.health); store.updateHealth(2, this.player2.health);
      store.updateMeter(1, this.player1.meter); store.updateMeter(2, this.player2.meter);
    }

    // Random dummy unsafe move triggers in CPU training mode
    if (storeState.gameMode === 'training' && storeState.dummyMode === 'cpu') {
      if (!this.player2.currentMove && this.player2.body.isGrounded && !this.player2.isInHitstun && !this.player2.isInBlockstun && !this.player2.isKnockedDown) {
        if (frame % 240 === 0 && Math.random() < 0.75) {
          const unsafeMoves = this.player2.def.moves.filter(m => m.onBlock < -5)
          if (unsafeMoves.length > 0) {
            const m = unsafeMoves[Math.floor(Math.random() * unsafeMoves.length)]
            this.player2.triggerAttack(m.id, frame)
          }
        }
      }
    }

    // Punishment alert processing for training mode
    if (storeState.gameMode === 'training') {
      if (this.player2.currentMove) {
        const move = this.player2.currentMove
        const isUnsafe = move.onBlock < -5
        if (this.player2.moveFrame > move.startup) {
          if (this.player1.isInBlockstun && isUnsafe) {
            useGameStore.getState().setPunishAlert('punishable')
            this.cpuRecoveryActive = true
          }
        }
      }
      
      if (this.cpuRecoveryActive) {
        if (this.player2.isInHitstun) {
          useGameStore.getState().setPunishAlert('punished')
          this.cpuRecoveryActive = false
          setTimeout(() => {
            if (useGameStore.getState().punishAlert === 'punished') {
              useGameStore.getState().setPunishAlert(null)
            }
          }, 1500)
        } else if (!this.player2.currentMove && !this.player2.isInHitstun) {
          this.cpuRecoveryActive = false
          setTimeout(() => {
            if (useGameStore.getState().punishAlert === 'punishable') {
              useGameStore.getState().setPunishAlert(null)
            }
          }, 1000)
        }
      }
    }

    this.updateCamera()
  }

  private resolveThrowBreak(victim: CharacterBase): void {
    const attacker = victim.throwOwner
    if (!attacker) return
    
    // Reset states
    victim.isBeingThrown = false
    victim.throwBreakTimer = 0
    victim.throwBreakPressed = false
    victim.throwOwner = null
    
    attacker.currentMove = null
    attacker.moveFrame = 0
    
    // Stagger pushback away from each other
    const dir = victim.body.position.x < attacker.body.position.x ? -1 : 1
    victim.body.velocity.x = dir * 0.18
    attacker.body.velocity.x = -dir * 0.18
    
    // Play parry or throw break sound
    this.audio.playSFX('block')
    this.particles.spawn('hit-spark', new Vector3((victim.body.position.x + attacker.body.position.x)/2, victim.body.position.y + 1.2, 0), '#FFFFFF')
    
    useGameStore.getState().setCustomBannerText("THROW BREAK!")
    setTimeout(() => useGameStore.getState().setCustomBannerText(null), 1200)
  }

  private resolveThrowSuccess(victim: CharacterBase): void {
    const attacker = victim.throwOwner
    if (!attacker) return
    
    victim.isBeingThrown = false
    victim.throwOwner = null
    
    // Apply throw damage and heavy knockdown
    victim.receiveHit(120, 60, { x: 0.35, y: 0.25, z: 0 })
    this.audio.playSFX('super_impact')
    
    // Attacker gains meter and enters recovery finish
    attacker.meter = Math.min(1000, attacker.meter + 150)
    
    // Clear visual banner
    useGameStore.getState().setCustomBannerText(null)
  }

  private updateHitboxVisualization(): void {
    const show = useSettingsStore.getState().showHitboxes
    if (!show || !this.player1 || !this.player2) {
      this.clearHitboxVisualization()
      return
    }

    this.drawCharacterHitboxes(this.player1, 'p1')
    this.drawCharacterHitboxes(this.player2, 'p2')
  }

  private drawCharacterHitboxes(char: CharacterBase, prefix: string): void {
    if (!char.rootNode) return

    // 1. Hurtbox (AABB green wireframe)
    const hurtboxName = `${prefix}_hurtbox`
    const hurtBox3D = this.collision.getCharacterHurtbox(
      char.body.position.x,
      char.body.position.y,
      char.body.position.z,
      char.body.width,
      char.body.height,
      char.body.depth
    )
    this.renderDebugBox(hurtboxName, hurtBox3D, new Color3(0, 1, 0))

    // 2. Active Strike Hitbox (AABB red wireframe)
    const hitboxName = `${prefix}_hitbox`
    if (char.currentMove) {
      const activeHitbox = char.currentMove.hitboxes.find(
        h => char.moveFrame >= h.frameStart && char.moveFrame <= h.frameEnd
      )
      if (activeHitbox) {
        const hitBox3D = this.collision.toWorldBox(
          activeHitbox,
          char.body.position.x,
          char.body.position.y,
          char.body.position.z,
          char.facingRight
        )
        this.renderDebugBox(hitboxName, hitBox3D, new Color3(1, 0, 0))
      } else {
        this.removeDebugBox(hitboxName)
      }
    } else {
      this.removeDebugBox(hitboxName)
    }
  }

  private renderDebugBox(name: string, box: any, color: Color3): void {
    const width = box.max.x - box.min.x
    const height = box.max.y - box.min.y
    const depth = box.max.z - box.min.z
    const posX = (box.min.x + box.max.x) / 2
    const posY = (box.min.y + box.max.y) / 2
    const posZ = (box.min.z + box.max.z) / 2

    let mesh = this.debugHitboxes.get(name)
    if (!mesh || mesh.isDisposed()) {
      mesh = MeshBuilder.CreateBox(name, { width: 1, height: 1, depth: 1 }, this.scene)
      
      const mat = new StandardMaterial(`${name}_mat`, this.scene)
      mat.diffuseColor = color
      mat.emissiveColor = color
      mat.wireframe = true
      mat.disableLighting = true
      mesh.material = mat
      this.debugHitboxes.set(name, mesh)
    }

    mesh.position.set(posX, posY, posZ)
    mesh.scaling.set(width, height, depth)
    mesh.setEnabled(true)
  }

  private removeDebugBox(name: string): void {
    const mesh = this.debugHitboxes.get(name)
    if (mesh) {
      mesh.setEnabled(false)
    }
  }

  private clearHitboxVisualization(): void {
    this.debugHitboxes.forEach(mesh => {
      if (mesh && !mesh.isDisposed()) {
        mesh.dispose()
      }
    })
    this.debugHitboxes.clear()
  }

  private resetForNextRound(): void {
    if (!this.player1 || !this.player2) return
    this.battleState = 'starting'
    this.stateTimer = 180
    this.roundTime = 99
    this.player1.health = 1000
    this.player2.health = 1000
    this.player1.body.position.x = -3
    this.player2.body.position.x = 3
    this.player1.body.position.y = 0
    this.player2.body.position.y = 0
    this.player1.body.position.z = 0
    this.player2.body.position.z = 0
    this.player1.body.velocity.x = 0
    this.player2.body.velocity.x = 0
    this.player1.body.velocity.y = 0
    this.player2.body.velocity.y = 0
    this.player1.body.velocity.z = 0
    this.player2.body.velocity.z = 0
    this.player1.currentAnimation = 'idle'
    this.player2.currentAnimation = 'idle'
    
    // Reset throw/parry states
    this.player1.isBeingThrown = false
    this.player2.isBeingThrown = false
    this.player1.throwBreakPressed = false
    this.player2.throwBreakPressed = false
    this.player1.throwOwner = null
    this.player2.throwOwner = null
    this.player1.isParrying = false
    this.player2.isParrying = false
    this.player1.body.isFrozen = false
    this.player2.body.isFrozen = false

    // Resume battle music if play mode
    if (useGameStore.getState().gameMode !== 'attract') {
      this.audio.startBattleMusic(useGameStore.getState().currentStageId)
    }

    useGameStore.getState().setCustomBannerText(null)
    useGameStore.getState().setBattleState('waiting')
    setTimeout(() => useGameStore.getState().setBattleState('starting'), 10)
  }

  private getEmptyInput() {
    return { left: false, right: false, up: false, down: false, punch: false, kick: false, heavyPunch: false, heavyKick: false, special: false, super: false, block: false, dash: false }
  }

  private checkCollisions(attacker: CharacterBase, victim: CharacterBase): void {
    if (!attacker.currentMove || attacker.hasLandedHit) return
    const victimHurtbox = this.collision.getCharacterHurtbox(victim.body.position.x, victim.body.position.y, victim.body.position.z, victim.body.width, victim.body.height, victim.body.depth)
    
    // Scale up depth if homing attack (heavy punches, heavy kicks, sweeps, spins)
    const isHoming = attacker.currentMove.id.includes('heavy') || attacker.currentMove.id.includes('spin') || attacker.currentMove.id.includes('sweep')
    const hitboxesToUse = attacker.currentMove.hitboxes.map(h => {
      if (isHoming) {
        return { ...h, depth: Math.max(h.depth, 3.5) }
      }
      return h
    })

    // Viper X Teleport Evade: automatically teleport behind the opponent if sidestepping their attack in Overdrive
    if (victim.isOverdriveActive && victim.id === 'viper-x' && (victim.sidestepTimer > 0 || victim.isSidewalking)) {
      const activeHitbox = hitboxesToUse.find(h => attacker.moveFrame >= h.frameStart && attacker.moveFrame <= h.frameEnd)
      if (activeHitbox) {
        const distVal = Math.abs(attacker.body.position.x - victim.body.position.x)
        if (distVal < 2.5) {
          const teleportX = attacker.body.position.x + (attacker.facingRight ? -1.5 : 1.5)
          victim.body.position.x = teleportX
          victim.body.position.z = attacker.body.position.z
          victim.sidestepTimer = 0
          victim.isSidewalking = false
          victim.body.velocity.x = 0
          victim.body.velocity.z = 0
          
          this.particles.spawn('hit-spark', victim.body.position as any, '#39FF14')
          this.audio.playSFX('swing')
          
          useGameStore.getState().setCustomBannerText("TELEPORT EVADE!")
          setTimeout(() => useGameStore.getState().setCustomBannerText(null), 1200)
          
          attacker.hasLandedHit = true 
          return
        }
      }
    }

    const hit = this.collision.checkAttackHit(attacker.body.position.x, attacker.body.position.y, attacker.body.position.z, attacker.facingRight, hitboxesToUse, attacker.moveFrame, victimHurtbox, victim.isBlocking)

    if (hit) {
      attacker.hasLandedHit = true
      
      // 1. Parry / Guard Impact Check
      const isNovaParry = victim.isOverdriveActive && victim.id === 'nova-star' && 
                          victim.currentMove !== null && victim.moveFrame <= victim.currentMove.startup &&
                          ['punch-light', 'punch-heavy', 'kick-light', 'kick-heavy', 'punch-hook', 'punch-uppercut'].includes(victim.currentMove.id)

      if (victim.isParrying || isNovaParry) {
        attacker.isInHitstun = true
        attacker.hitstunTimer = 45
        attacker.currentMove = null
        attacker.currentAnimation = 'hit-stun'
        attacker.body.velocity.x = attacker.facingRight ? -0.15 : 0.15
        attacker.body.velocity.z = 0
        
        this.audio.playSFX('menu_select')
        
        const hitPos = new Vector3((attacker.body.position.x + victim.body.position.x) / 2, attacker.body.position.y + 1.5, (attacker.body.position.z + victim.body.position.z) / 2)
        this.particles.spawn('hit-spark', hitPos, '#FFFF00')
        
        useGameStore.getState().setCustomBannerText(isNovaParry ? "PARRY GUARD IMPACT!" : "GUARD IMPACT!")
        setTimeout(() => useGameStore.getState().setCustomBannerText(null), 1200)
        return
      }

      // 2. Throw check
      if (attacker.currentMove.id === 'throw') {
        victim.isBeingThrown = true
        victim.throwBreakTimer = 12
        victim.throwBreakPressed = false
        victim.throwOwner = attacker
        
        this.audio.playSFX('swing')
        return
      }

      const hitPos = new Vector3((attacker.body.position.x + victim.body.position.x) / 2, attacker.body.position.y + 1.5, (attacker.body.position.z + victim.body.position.z) / 2)
      const store = useGameStore.getState()
      store.incrementCombo(attacker === this.player1 ? 1 : 2)
      
      const isHeavy = attacker.currentMove.id.includes('heavy') || attacker.currentMove.id === 'punch-uppercut' || attacker.currentMove.id === 'punch-hook'
      const isCounterHit = !victim.isBlocking && victim.currentMove !== null && victim.moveFrame <= (victim.currentMove.startup + victim.currentMove.active)
      
      if (victim.isBlocking) { 
        let blockstun = hit.blockstun
        let adv = attacker.currentMove.onBlock
        if (attacker.isOverdriveActive && attacker.id === 'kai-storm') {
          blockstun += 4
          adv += 4
        }

        victim.receiveBlock(hit.damage, blockstun)
        this.audio.playSFX('block')
        this.particles.spawn('dust', hitPos, '#AAAAAA')
        if ('vibrate' in navigator) navigator.vibrate(30)
        
        store.setFrameAdvantage(attacker === this.player1 ? 1 : 2, adv)
      }
      else { 
        let hitstun = hit.hitstun
        if (isCounterHit) {
          hitstun = Math.floor(hitstun * 1.5)
          this.counterFlashTimer = 3 // flash screen white (3 frames)
          this.particles.spawn('sweat', hitPos, '#AADDFF')
          this.audio.playSFX('menu_select', 1.2) // play counter chime
          
          store.setCustomBannerText("COUNTER HIT!")
          setTimeout(() => {
            if (store.customBannerText === "COUNTER HIT!") store.setCustomBannerText(null)
          }, 1000)
        }

        victim.receiveHit(hit.damage, hitstun, hit.knockback)
        this.particles.spawn('hit-spark', hitPos, attacker.def.colors.aura)
        this.particles.spawn('dust', hitPos, '#AAAAAA')
        
        // Scale hit sound volumes
        const moveId = attacker.currentMove.id
        let volumeScale = 1.0
        if (moveId === 'punch-light') volumeScale = 0.6
        else if (moveId === 'punch-hook') volumeScale = 1.1
        else if (moveId === 'punch-uppercut') volumeScale = 1.6

        this.audio.playSFX(isHeavy ? 'super_impact' : 'hit', volumeScale)
        this.shakeCamera(isHeavy ? 0.45 : 0.25, 12)
        if ('vibrate' in navigator) navigator.vibrate(isHeavy ? 75 : 40)
        
        const adv = attacker.currentMove.onHit
        store.setFrameAdvantage(attacker === this.player1 ? 1 : 2, adv)
      }
      
      const hs = isHeavy ? 8 : 4
      attacker.applyHitstop(hs)
      victim.applyHitstop(hs)
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
    const midpointZ = (this.player1.body.position.z + this.player2.body.position.z) / 2
    const targetPos = new Vector3(midpointX, midpointY, midpointZ)

    if (this.shakeTimer > 0) {
      targetPos.x += (Math.random() - 0.5) * this.shakeIntensity
      targetPos.y += (Math.random() - 0.5) * this.shakeIntensity
      targetPos.z += (Math.random() - 0.5) * this.shakeIntensity
      this.shakeTimer--
    }

    const dx = this.player2.body.position.x - this.player1.body.position.x
    const dz = this.player2.body.position.z - this.player1.body.position.z
    const targetAlpha = Math.atan2(dz, dx) + Math.PI / 2
    let diff = targetAlpha - this.camera.alpha
    diff = Math.atan2(Math.sin(diff), Math.cos(diff))
    this.camera.alpha += diff * 0.08

    if (this.isSuperFlashActive) {
      const activePlayer = this.player1.currentMove?.type === 'super' ? this.player1 : this.player2
      targetPos.copyFrom(activePlayer.body.position as any)
      targetPos.y += 1.5
      this.camera.radius = 5.5
    } else if (this.battleState === 'ko') {
      const dist = Math.sqrt(dx * dx + dz * dz)
      this.camera.radius = Math.max(4.0, Math.min(dist * 0.9, 10))
    } else {
      const dist = Math.sqrt(dx * dx + dz * dz)
      this.camera.radius = Math.max(8, Math.min(dist * 1.5, 18))
    }

    this.camera.setTarget(targetPos)
  }

  private render(_interpolation: number): void { }

  start(): void { this.engine.runRenderLoop(() => { this.scene.render() }) }
  
  stop(): void { 
    this.gameLoop.stop()
    this.engine.stopRenderLoop() 
    this.audio.stopMusic()
    this.clearHitboxVisualization()
  }

  getScene(): Scene { return this.scene }
}
