import type { Vector3D } from '@game-types/game.types'
import type { HitboxFrame } from '@game-types/character.types'

export interface Box3D {
  min: Vector3D
  max: Vector3D
}

export interface HitResult {
  hit: boolean
  damage: number
  hitstun: number
  blockstun: number
  knockback: Vector3D
  hitType: 'light' | 'heavy' | 'special' | 'super'
}

export class CollisionDetector {
  // AABB 3D test
  boxesOverlap(a: Box3D, b: Box3D): boolean {
    return (
      a.min.x <= b.max.x &&
      a.max.x >= b.min.x &&
      a.min.y <= b.max.y &&
      a.max.y >= b.min.y &&
      a.min.z <= b.max.z &&
      a.max.z >= b.min.z
    )
  }

  // Transform hitbox from local space to world space
  toWorldBox(
    hitbox: HitboxFrame,
    originX: number,
    originY: number,
    originZ: number,
    facingRight: boolean
  ): Box3D {
    // If facing left, we flip the X offset.
    const width = hitbox.width
    const offsetX = facingRight ? hitbox.x : -(hitbox.x + width)
    
    const x = originX + offsetX
    const y = originY + hitbox.y
    const z = originZ + hitbox.z

    return {
      min: { x, y, z: z - hitbox.depth / 2 },
      max: {
        x: x + width,
        y: y + hitbox.height,
        z: z + hitbox.depth / 2,
      },
    }
  }

  // Simple hurtbox for character (can be expanded to multiple boxes later)
  getCharacterHurtbox(
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number
  ): Box3D {
    return {
      min: { x: x - width / 2, y, z: z - depth / 2 },
      max: { x: x + width / 2, y: y + height, z: z + depth / 2 }
    }
  }

  checkAttackHit(
    attackerX: number, attackerY: number, attackerZ: number, facingRight: boolean,
    moveHitboxes: HitboxFrame[], moveFrame: number,
    victimHurtbox: Box3D,
    isBlocking: boolean
  ): HitResult | null {
    const activeHitbox = moveHitboxes.find(h => moveFrame >= h.frameStart && moveFrame <= h.frameEnd)
    if (!activeHitbox) return null

    const worldAttackBox = this.toWorldBox(activeHitbox, attackerX, attackerY, attackerZ, facingRight)

    if (this.boxesOverlap(worldAttackBox, victimHurtbox)) {
      const damage = isBlocking ? Math.floor((activeHitbox.damage ?? 0) * 0.1) : (activeHitbox.damage ?? 0)
      return {
        hit: true,
        damage,
        hitstun: isBlocking ? 0 : (activeHitbox.hitstun ?? 15),
        blockstun: isBlocking ? (activeHitbox.blockstun ?? 12) : 0,
        knockback: activeHitbox.knockback ?? { x: 0.1, y: 0.05, z: 0 },
        hitType: 'light'
      }
    }

    return null
  }
}
