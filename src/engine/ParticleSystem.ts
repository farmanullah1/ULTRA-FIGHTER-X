import { Scene, ParticleSystem, Vector3, Color4, Texture, GPUParticleSystem } from '@babylonjs/core'

export type ParticleType = 
  | 'hit-spark'
  | 'blood-energy'
  | 'block-spark'
  | 'dust'
  | 'super-explosion'
  | 'ko-explosion'
  | 'sweat'

export class ParticleSystemManager {
  private scene: Scene

  constructor(scene: Scene) {
    this.scene = scene
  }

  spawn(type: ParticleType, position: Vector3, color: string = '#FFFFFF'): void {
    const ps = GPUParticleSystem.IsSupported 
      ? new GPUParticleSystem('ps', { capacity: 500 }, this.scene)
      : new ParticleSystem('ps', 500, this.scene)
    
    ps.particleTexture = new Texture('/assets/textures/flare.png', this.scene)
    ps.emitter = position
    
    const col = Color4.FromHexString(color + (type === 'dust' ? '66' : 'FF'))
    ps.color1 = col
    ps.color2 = col
    ps.colorDead = new Color4(0, 0, 0, 0)
    
    if (type === 'dust') {
      ps.minEmitBox = new Vector3(-0.3, 0.05, -0.3)
      ps.maxEmitBox = new Vector3(0.3, 0.2, 0.3)
      ps.minSize = 0.25
      ps.maxSize = 0.55
      ps.minLifeTime = 0.4
      ps.maxLifeTime = 0.75
      ps.emitRate = 40
      ps.manualEmitCount = 18
      ps.blendMode = ParticleSystem.BLENDMODE_STANDARD
      ps.gravity = new Vector3(0, 0.8, 0)
      ps.direction1 = new Vector3(-0.3, 0.5, -0.3)
      ps.direction2 = new Vector3(0.3, 1.2, 0.3)
      ps.minEmitPower = 0.2
      ps.maxEmitPower = 0.7
    } else if (color === '#AADDFF') { // Sweat particles
      ps.minEmitBox = new Vector3(-0.05, -0.05, -0.05)
      ps.maxEmitBox = new Vector3(0.05, 0.05, 0.05)
      ps.minSize = 0.04
      ps.maxSize = 0.12
      ps.minLifeTime = 0.15
      ps.maxLifeTime = 0.4
      ps.emitRate = 80
      ps.manualEmitCount = 25
      ps.blendMode = ParticleSystem.BLENDMODE_STANDARD
      ps.gravity = new Vector3(0, -12.0, 0)
      ps.direction1 = new Vector3(-0.8, 0.8, -0.8)
      ps.direction2 = new Vector3(0.8, 2.0, 0.8)
      ps.minEmitPower = 1.5
      ps.maxEmitPower = 3.5
    } else { // Standard impact sparks
      ps.minEmitBox = new Vector3(-0.1, -0.1, -0.1)
      ps.maxEmitBox = new Vector3(0.1, 0.1, 0.1)
      ps.minSize = 0.1
      ps.maxSize = 0.3
      ps.minLifeTime = 0.2
      ps.maxLifeTime = 0.5
      ps.emitRate = 100
      ps.manualEmitCount = 50
      ps.blendMode = ParticleSystem.BLENDMODE_ADD
      ps.gravity = new Vector3(0, -9.81, 0)
      ps.direction1 = new Vector3(-1, 1, -1)
      ps.direction2 = new Vector3(1, 1, 1)
      ps.minEmitPower = 1
      ps.maxEmitPower = 5
    }
    
    ps.updateSpeed = 0.01
    ps.start()
    
    setTimeout(() => {
      ps.stop()
      setTimeout(() => ps.dispose(), 1000)
    }, 100)
  }
}
