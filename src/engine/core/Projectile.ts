import { Vector3, AbstractMesh, Scene, MeshBuilder, PBRMaterial, Color3, PointLight } from '@babylonjs/core'
import type { ProjectileConfig } from '@game-types/character.types'
import { ParticleSystemManager } from '../ParticleSystem'

export class Projectile {
  id: string
  ownerId: string
  config: ProjectileConfig
  position: Vector3
  velocity: Vector3
  mesh: AbstractMesh
  light: PointLight | null = null
  lifespan: number
  isDead: boolean = false
  facingRight: boolean

  constructor(
    ownerId: string,
    config: ProjectileConfig,
    startPos: Vector3,
    facingRight: boolean,
    scene: Scene,
    particles: ParticleSystemManager
  ) {
    this.id = `proj_${ownerId}_${Date.now()}`
    this.ownerId = ownerId
    this.config = config
    this.position = startPos.clone()
    this.facingRight = facingRight
    this.lifespan = config.lifespan

    this.velocity = new Vector3(config.speed * (facingRight ? 1 : -1), 0, 0)

    // Create high-graphics mesh
    this.mesh = MeshBuilder.CreateSphere(this.id, {
      diameterX: config.width,
      diameterY: config.height,
      diameterZ: config.depth
    }, scene)
    this.mesh.position = this.position

    const mat = new PBRMaterial(`${this.id}_mat`, scene)
    mat.emissiveColor = Color3.FromHexString(config.glowColor)
    mat.emissiveIntensity = 5
    mat.albedoColor = Color3.FromHexString(config.color)
    this.mesh.material = mat

    // Add light for "very high graphics" feel
    this.light = new PointLight(`${this.id}_light`, Vector3.Zero(), scene)
    this.light.parent = this.mesh
    this.light.diffuse = Color3.FromHexString(config.glowColor)
    this.light.intensity = 0.5
    this.light.range = 5

    // Spawn initial trail
    particles.spawn('hit-spark', this.position, config.glowColor)
  }

  update(particles: ParticleSystemManager): void {
    this.position.addInPlace(this.velocity)
    this.mesh.position.copyFrom(this.position)
    
    this.lifespan--
    if (this.lifespan <= 0) {
      this.isDead = true
    }

    // Spawn trail particles occasionally
    if (this.lifespan % 5 === 0) {
      particles.spawn('dust', this.position, this.config.glowColor)
    }
  }

  dispose(): void {
    this.mesh.dispose()
    if (this.light) this.light.dispose()
  }
}
