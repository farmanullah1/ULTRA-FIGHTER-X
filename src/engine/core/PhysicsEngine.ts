import { GRAVITY, MAX_FALL_SPEED, FLOOR_Y } from '@constants/gameConstants'
import type { Vector3D } from '@game-types/game.types'

export interface PhysicsBody {
  position: Vector3D
  velocity: Vector3D
  width: number
  height: number
  depth: number
  isGrounded: boolean
  isAirborne: boolean
  mass: number
  isFrozen: boolean  // hitstop
  hitWall?: 'x' | 'z' | null
}

export class PhysicsEngine {
  // Current active stage boundaries
  public bounds = { x: 16.0, z: 8.0 }
  public isRingOut = false

  update(body: PhysicsBody): void {
    if (body.isFrozen) return

    body.hitWall = null

    // 1. Apply gravity with weight class gravity scaling
    if (!body.isGrounded) {
      const gravityScale = body.mass > 1.2 ? 1.35 : (body.mass < 0.95 ? 0.8 : 1.0)
      body.velocity.y = Math.max(body.velocity.y + GRAVITY * gravityScale, MAX_FALL_SPEED)
    }

    // Integrate position
    body.position.x += body.velocity.x
    body.position.y += body.velocity.y
    body.position.z += body.velocity.z

    // 2. Floor collision
    // If it's a ring-out stage and the player falls beyond bounds, they drop below the floor level!
    const outOfRing = this.isRingOut && (Math.abs(body.position.x) > this.bounds.x || Math.abs(body.position.z) > this.bounds.z)

    if (body.position.y <= FLOOR_Y && !outOfRing) {
      body.position.y = FLOOR_Y
      body.velocity.y = 0
      body.isGrounded = true
      body.isAirborne = false
    } else {
      body.isGrounded = false
      body.isAirborne = true
    }

    // 3. Wall/Boundary Collision (clamped on walled stages)
    if (!this.isRingOut) {
      if (body.position.x < -this.bounds.x) {
        body.position.x = -this.bounds.x
        body.velocity.x = 0
        body.hitWall = 'x'
      }
      if (body.position.x > this.bounds.x) {
        body.position.x = this.bounds.x
        body.velocity.x = 0
        body.hitWall = 'x'
      }
      if (body.position.z < -this.bounds.z) {
        body.position.z = -this.bounds.z
        body.velocity.z = 0
        body.hitWall = 'z'
      }
      if (body.position.z > this.bounds.z) {
        body.position.z = this.bounds.z
        body.velocity.z = 0
        body.hitWall = 'z'
      }
    }

    // Horizontal friction when grounded
    if (body.isGrounded) {
      body.velocity.x *= 0.78
      body.velocity.z *= 0.78
      if (Math.abs(body.velocity.x) < 0.001) body.velocity.x = 0
      if (Math.abs(body.velocity.z) < 0.001) body.velocity.z = 0
    }
  }

  applyForce(body: PhysicsBody, force: Vector3D): void {
    if (body.isFrozen) return
    body.velocity.x += force.x / body.mass
    body.velocity.y += force.y / body.mass
    body.velocity.z += force.z / body.mass
  }

  jump(body: PhysicsBody, jumpPower: number): void {
    if (body.isGrounded) {
      body.velocity.y = jumpPower
      body.isGrounded = false
      body.isAirborne = true
    }
  }

  // Push characters apart when overlapping (collision resolution in full X-Z plane)
  resolveOverlap(bodyA: PhysicsBody, bodyB: PhysicsBody): void {
    const dx = bodyB.position.x - bodyA.position.x
    const dz = bodyB.position.z - bodyA.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    const minDist = (bodyA.width + bodyB.width) / 2

    if (dist < minDist) {
      const overlap = minDist - dist
      // If exactly overlapping, push along X-axis
      const dirX = dist > 0 ? dx / dist : 1
      const dirZ = dist > 0 ? dz / dist : 0

      bodyA.position.x -= (overlap / 2) * dirX
      bodyA.position.z -= (overlap / 2) * dirZ
      bodyB.position.x += (overlap / 2) * dirX
      bodyB.position.z += (overlap / 2) * dirZ
    }
  }
}
