import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, DirectionalLight, ShadowGenerator, DefaultRenderingPipeline, Color4 } from '@babylonjs/core'
import { AssetManager } from './AssetManager'
import { PhysicsEngine } from './PhysicsEngine'
import { CollisionDetector } from './CollisionDetector'
import { InputManager } from './InputManager'

export class GameEngine3D {
  private engine: Engine
  private scene: Scene
  private canvas: HTMLCanvasElement
  
  assetManager: AssetManager
  physics: PhysicsEngine
  collision: CollisionDetector
  input: InputManager
  
  camera: ArcRotateCamera | null = null
  shadowGenerator: ShadowGenerator | null = null

  constructor(canvas: HTMLCanvasElement, inputManager: InputManager) {
    this.canvas = canvas
    this.input = inputManager
    this.engine = new Engine(canvas, true)
    this.scene = new Scene(this.engine)
    this.scene.clearColor = new Color4(0.01, 0.01, 0.03, 1)
    
    this.assetManager = new AssetManager(this.scene)
    this.physics = new PhysicsEngine()
    this.collision = new CollisionDetector()
    
    this.initScene()
    this.initPipeline()
    
    window.addEventListener('resize', () => {
      this.engine.resize()
    })
  }

  private initScene(): void {
    // Camera
    this.camera = new ArcRotateCamera(
      'mainCamera',
      Math.PI / 2,
      Math.PI / 2.2,
      10,
      Vector3.Zero(),
      this.scene
    )
    this.camera.attachControl(this.canvas, true)
    
    // Lighting
    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), this.scene)
    hemiLight.intensity = 0.5
    
    const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -2, -1), this.scene)
    dirLight.position = new Vector3(20, 40, 20)
    dirLight.intensity = 0.8
    
    // Shadows
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

  start(): void {
    this.engine.runRenderLoop(() => {
      this.scene.render()
    })
  }

  stop(): void {
    this.engine.stopRenderLoop()
  }

  getScene(): Scene {
    return this.scene
  }
}
