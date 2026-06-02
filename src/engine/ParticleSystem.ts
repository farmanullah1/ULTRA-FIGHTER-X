import { Scene, ParticleSystem, Vector3, Color4, Texture, GPUParticleSystem, Engine } from '@babylonjs/core'

export type ParticleType = 
  | 'hit-spark'
  | 'blood-energy'
  | 'block-spark'
  | 'dust'
  | 'super-explosion'
  | 'ko-explosion'

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
    ps.minEmitBox = new Vector3(-0.1, -0.1, -0.1)
    ps.maxEmitBox = new Vector3(0.1, 0.1, 0.1)
    
    const col = Color4.FromHexString(color + 'FF')
    ps.color1 = col
    ps.color2 = col
    ps.colorDead = new Color4(0, 0, 0, 0)
    
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
    ps.updateSpeed = 0.01
    
    ps.start()
    
    setTimeout(() => {
      ps.stop()
      setTimeout(() => ps.dispose(), 1000)
    }, 100)
  }
}
