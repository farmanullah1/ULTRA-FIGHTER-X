import { GRAVITY, MAX_FALL_SPEED, FLOOR_Y, WALL_LEFT, WALL_RIGHT } from '@constants/gameConstants'
import type { Vector3D } from '@types/game.types'

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
}

export class PhysicsEngine {
  update(body: PhysicsBody): void {
    if (body.isFrozen) return

    // Apply gravity
    if (!body.isGrounded) {
      body.velocity.y = Math.max(body.velocity.y + GRAVITY, MAX_FALL_SPEED)
    }

    // Integrate position
    body.position.x += body.velocity.x
    body.position.y += body.velocity.y
    body.position.z += body.velocity.z

    // Floor collision
    if (body.position.y <= FLOOR_Y) {
      body.position.y = FLOOR_Y
      body.velocity.y = 0
      body.isGrounded = true
      body.isAirborne = false
    } else {
      body.isGrounded = false
    }

    // Wall collision
    if (body.position.x < WALL_LEFT) {
      body.position.x = WALL_LEFT
      body.velocity.x = 0
    }
    if (body.position.x > WALL_RIGHT) {
      body.position.x = WALL_RIGHT
      body.velocity.x = 0
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

  // Push characters apart when overlapping (collision resolution)
  resolveOverlap(bodyA: PhysicsBody, bodyB: PhysicsBody): void {
    const dx = bodyB.position.x - bodyA.position.x
    const minDist = (bodyA.width + bodyB.width) / 2

    if (Math.abs(dx) < minDist) {
      const overlap = minDist - Math.abs(dx)
      const dir = dx > 0 ? 1 : -1
      bodyA.position.x -= (overlap / 2) * dir
      bodyB.position.x += (overlap / 2) * dir
    }
  }
}
