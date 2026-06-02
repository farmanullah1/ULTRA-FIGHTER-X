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
  wasTradeable: boolean
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
    const flippedX = facingRight ? hitbox.x : -(hitbox.x + hitbox.width)
    const x = originX + flippedX
    const y = originY + hitbox.y
    const z = originZ + hitbox.z

    return {
      min: { x, y, z },
      max: {
        x: x + hitbox.width,
        y: y + hitbox.height,
        z: z + hitbox.depth,
      },
    }
  }

  checkAttackHit(
    attackBox: Box3D,
    hurtBox: Box3D,
    hitboxDef: HitboxFrame,
    isBlocking: boolean
  ): HitResult | null {
    if (!this.boxesOverlap(attackBox, hurtBox)) return null

    return {
      hit: true,
      damage: isBlocking ? Math.floor((hitboxDef.damage ?? 0) * 0.1) : (hitboxDef.damage ?? 0),
      hitstun: isBlocking ? 0 : (hitboxDef.hitstun ?? 15),
      blockstun: isBlocking ? (hitboxDef.blockstun ?? 12) : 0,
      knockback: hitboxDef.knockback ?? { x: 0.1, y: 0.05, z: 0 },
      hitType: 'light',
      wasTradeable: false,
    }
  }
}
