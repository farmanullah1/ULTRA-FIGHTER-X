/**
 * ParticleSystemManager — Pooled, high-performance particle system for ULTRA FIGHTER X.
 *
 * Architecture:
 *  - 20 CPUParticleSystem instances are pre-allocated at construction time and
 *    kept in a free-list (the pool).  GPUParticleSystem is used instead when
 *    available and supported by the browser/GPU.
 *  - spawn()           → one-shot burst: grab from pool → configure → start →
 *                        schedule return-to-pool after the effect lifetime.
 *  - spawnContinuous() → continuous emitter: same pool grab, but the system
 *                        keeps running until the caller invokes stop().
 *  - No new ParticleSystem / no new Texture is ever created after init().
 *    Every texture is loaded once and shared across all pool entries.
 *
 * No GC spikes: all per-spawn work touches only existing, pooled objects.
 */

import {
  Scene,
  ParticleSystem,
  Vector3,
  Color4,
  Texture,
  GPUParticleSystem,
} from '@babylonjs/core'

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type ParticleType =
  | 'hit-spark-light'
  | 'hit-spark-medium'
  | 'hit-spark-heavy'
  | 'block-spark'
  | 'dust-land'
  | 'dust-step'
  | 'super-explosion'
  | 'ko-explosion'
  | 'fire-trail'
  | 'lightning-arc'
  | 'parry-flash'
  | 'victory-confetti'
  | 'character-aura'
  | 'sweat'
  | 'blood-energy'

export interface ContinuousEmitterHandle {
  stop: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Parse a CSS hex colour string such as '#FF8800' or 'FF8800' into Color4. */
function hexToColor4(hex: string, alpha = 1.0): Color4 {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255
  return new Color4(r, g, b, alpha)
}

/** Clamp a value between min and max. */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-type configuration descriptors
// ─────────────────────────────────────────────────────────────────────────────

interface ParticleConfig {
  /** How many particles to emit in a one-shot burst (manualEmitCount). */
  count: number
  /** Particle lifetime range [s]. */
  minLife: number
  maxLife: number
  /** Particle size range (world units). */
  minSize: number
  maxSize: number
  /** Emit-box half-extents around the spawn position. */
  emitBoxHalf: Vector3
  /** Initial velocity direction min/max. */
  dir1: Vector3
  dir2: Vector3
  /** Speed range (world units / s). */
  minPower: number
  maxPower: number
  /** World-space gravity acceleration. */
  gravity: Vector3
  /** Primary colour A. */
  color1: Color4
  /** Primary colour B (random lerp between color1 and color2). */
  color2: Color4
  /** Colour when particle reaches end of life. */
  colorDead: Color4
  /** Additive or standard alpha blending. */
  blend: number
  /** Particle texture path (relative to /assets/textures/). */
  texture: 'flare' | 'square' | 'smoke'
  /** updateSpeed (simulation timestep multiplier). Default 0.01. */
  updateSpeed?: number
  /**
   * If true this config is meant for continuous use (fire-trail, aura, etc.)
   * and spawn() will auto-stop after maxLife * 3 seconds so pool is reclaimed.
   */
  continuous?: boolean
}

const ZERO_GRAVITY = new Vector3(0, 0, 0)
const LIGHT_GRAVITY = new Vector3(0, -4, 0)
const MED_GRAVITY = new Vector3(0, -9.81, 0)
const HEAVY_GRAVITY = new Vector3(0, -18, 0)
const LIFT_GRAVITY = new Vector3(0, 2, 0) // for fire/aura rising

const DEAD = new Color4(0, 0, 0, 0)

const CONFIGS: Record<ParticleType, ParticleConfig> = {
  // ── hit-spark-light ───────────────────────────────────────────────────────
  'hit-spark-light': {
    count: 15,
    minLife: 0.15,
    maxLife: 0.3,
    minSize: 0.04,
    maxSize: 0.14,
    emitBoxHalf: new Vector3(0.05, 0.05, 0.05),
    dir1: new Vector3(-1.2, 0.5, -0.5),
    dir2: new Vector3(1.2, 2.0, 0.5),
    minPower: 3,
    maxPower: 8,
    gravity: MED_GRAVITY,
    color1: new Color4(1.0, 1.0, 0.8, 1),   // near-white yellow
    color2: new Color4(1.0, 0.95, 0.3, 1),  // bright yellow
    colorDead: DEAD,
    blend: ParticleSystem.BLENDMODE_ADD,
    texture: 'flare',
    updateSpeed: 0.012,
  },

  // ── hit-spark-medium ─────────────────────────────────────────────────────
  'hit-spark-medium': {
    count: 25,
    minLife: 0.25,
    maxLife: 0.5,
    minSize: 0.07,
    maxSize: 0.22,
    emitBoxHalf: new Vector3(0.08, 0.08, 0.08),
    dir1: new Vector3(-1.5, 0.2, -0.6),
    dir2: new Vector3(1.5, 2.5, 0.6),
    minPower: 2,
    maxPower: 6,
    gravity: LIGHT_GRAVITY,
    color1: new Color4(1.0, 0.55, 0.05, 1), // bright orange
    color2: new Color4(1.0, 0.3,  0.0,  1), // deep orange
    colorDead: DEAD,
    blend: ParticleSystem.BLENDMODE_ADD,
    texture: 'flare',
    updateSpeed: 0.01,
  },

  // ── hit-spark-heavy ──────────────────────────────────────────────────────
  'hit-spark-heavy': {
    count: 40,
    minLife: 0.35,
    maxLife: 0.7,
    minSize: 0.1,
    maxSize: 0.35,
    emitBoxHalf: new Vector3(0.15, 0.15, 0.15),
    dir1: new Vector3(-2.5, -0.5, -1.0),
    dir2: new Vector3(2.5,  3.0,  1.0),
    minPower: 3,
    maxPower: 10,
    gravity: MED_GRAVITY,
    color1: new Color4(1.0, 1.0,  0.9, 1),  // near-white
    color2: new Color4(1.0, 0.85, 0.1, 1),  // gold
    colorDead: DEAD,
    blend: ParticleSystem.BLENDMODE_ADD,
    texture: 'flare',
    updateSpeed: 0.01,
  },

  // ── block-spark ──────────────────────────────────────────────────────────
  'block-spark': {
    count: 20,
    minLife: 0.2,
    maxLife: 0.45,
    minSize: 0.06,
    maxSize: 0.2,
    emitBoxHalf: new Vector3(0.05, 0.05, 0.05),
    dir1: new Vector3(-1.5, -1.5, -0.5),
    dir2: new Vector3(1.5,  1.5,  0.5),
    minPower: 3,
    maxPower: 7,
    gravity: LIGHT_GRAVITY,
    color1: new Color4(0.3, 1.0,  1.0, 1),  // cyan
    color2: new Color4(0.0, 0.85, 1.0, 1),  // light blue
    colorDead: DEAD,
    blend: ParticleSystem.BLENDMODE_ADD,
    texture: 'flare',
    updateSpeed: 0.012,
  },

  // ── dust-land ─────────────────────────────────────────────────────────────
  'dust-land': {
    count: 22,
    minLife: 0.4,
    maxLife: 0.8,
    minSize: 0.25,
    maxSize: 0.6,
    emitBoxHalf: new Vector3(0.4, 0.02, 0.4),
    dir1: new Vector3(-1.0, 0.3, -1.0),
    dir2: new Vector3(1.0,  1.2,  1.0),
    minPower: 0.5,
    maxPower: 1.8,
    gravity: LIFT_GRAVITY,       // dust drifts upward then fades
    color1: new Color4(0.6, 0.55, 0.5, 0.7),
    color2: new Color4(0.5, 0.45, 0.4, 0.5),
    colorDead: new Color4(0.4, 0.38, 0.35, 0),
    blend: ParticleSystem.BLENDMODE_STANDARD,
    texture: 'smoke',
    updateSpeed: 0.008,
  },

  // ── dust-step ─────────────────────────────────────────────────────────────
  'dust-step': {
    count: 6,
    minLife: 0.2,
    maxLife: 0.4,
    minSize: 0.1,
    maxSize: 0.25,
    emitBoxHalf: new Vector3(0.15, 0.01, 0.15),
    dir1: new Vector3(-0.5, 0.2, -0.5),
    dir2: new Vector3(0.5,  0.8,  0.5),
    minPower: 0.2,
    maxPower: 0.8,
    gravity: LIFT_GRAVITY,
    color1: new Color4(0.55, 0.5, 0.45, 0.5),
    color2: new Color4(0.45, 0.42, 0.38, 0.35),
    colorDead: new Color4(0.4, 0.38, 0.35, 0),
    blend: ParticleSystem.BLENDMODE_STANDARD,
    texture: 'smoke',
    updateSpeed: 0.01,
  },

  // ── super-explosion ──────────────────────────────────────────────────────
  'super-explosion': {
    count: 200,
    minLife: 0.5,
    maxLife: 1.2,
    minSize: 0.15,
    maxSize: 0.55,
    emitBoxHalf: new Vector3(0.3, 0.3, 0.3),
    dir1: new Vector3(-3, -1, -1),
    dir2: new Vector3(3,   4,  1),
    minPower: 4,
    maxPower: 14,
    gravity: MED_GRAVITY,
    // Defaults; overridden at runtime by the character aura colour
    color1: new Color4(1.0, 0.5, 0.0, 1),
    color2: new Color4(1.0, 1.0, 0.3, 1),
    colorDead: DEAD,
    blend: ParticleSystem.BLENDMODE_ADD,
    texture: 'flare',
    updateSpeed: 0.01,
  },

  // ── ko-explosion ─────────────────────────────────────────────────────────
  'ko-explosion': {
    count: 300,
    minLife: 0.8,
    maxLife: 2.5,
    minSize: 0.2,
    maxSize: 0.9,
    emitBoxHalf: new Vector3(0.5, 0.5, 0.5),
    dir1: new Vector3(-5, -2, -2),
    dir2: new Vector3(5,   6,  2),
    minPower: 2,
    maxPower: 12,
    gravity: new Vector3(0, -3, 0),  // slow drift down for drama
    color1: new Color4(1.0, 0.9, 0.6, 1),
    color2: new Color4(1.0, 0.3, 0.0, 1),
    colorDead: DEAD,
    blend: ParticleSystem.BLENDMODE_ADD,
    texture: 'flare',
    updateSpeed: 0.008,
  },

  // ── fire-trail ───────────────────────────────────────────────────────────
  'fire-trail': {
    count: 30,      // emitRate for continuous
    minLife: 0.3,
    maxLife: 0.7,
    minSize: 0.1,
    maxSize: 0.35,
    emitBoxHalf: new Vector3(0.12, 0.05, 0.12),
    dir1: new Vector3(-0.4, 1.0, -0.4),
    dir2: new Vector3(0.4,  2.5,  0.4),
    minPower: 0.5,
    maxPower: 2.0,
    gravity: LIFT_GRAVITY,
    color1: new Color4(1.0, 0.5,  0.05, 1),
    color2: new Color4(1.0, 0.15, 0.0,  0.9),
    colorDead: new Color4(0.2, 0.1, 0.0, 0),
    blend: ParticleSystem.BLENDMODE_ADD,
    texture: 'flare',
    continuous: true,
    updateSpeed: 0.012,
  },

  // ── lightning-arc ────────────────────────────────────────────────────────
  'lightning-arc': {
    count: 18,
    minLife: 0.05,
    maxLife: 0.18,
    minSize: 0.03,
    maxSize: 0.14,
    emitBoxHalf: new Vector3(0.2, 0.2, 0.2),
    dir1: new Vector3(-2, -2, -2),
    dir2: new Vector3(2,   2,  2),
    minPower: 5,
    maxPower: 14,
    gravity: ZERO_GRAVITY,
    color1: new Color4(0.6, 0.8,  1.0, 1),
    color2: new Color4(1.0, 1.0,  1.0, 1),
    colorDead: DEAD,
    blend: ParticleSystem.BLENDMODE_ADD,
    texture: 'flare',
    updateSpeed: 0.02,
  },

  // ── parry-flash ──────────────────────────────────────────────────────────
  'parry-flash': {
    count: 28,
    minLife: 0.2,
    maxLife: 0.4,
    minSize: 0.08,
    maxSize: 0.28,
    emitBoxHalf: new Vector3(0.05, 0.05, 0.05),
    dir1: new Vector3(-2.5, -2.5, -0.5),
    dir2: new Vector3(2.5,   2.5,  0.5),
    minPower: 3,
    maxPower: 8,
    gravity: ZERO_GRAVITY,
    color1: new Color4(0.2, 1.0, 1.0, 1),   // cyan
    color2: new Color4(1.0, 0.9, 0.1, 1),   // gold
    colorDead: DEAD,
    blend: ParticleSystem.BLENDMODE_ADD,
    texture: 'flare',
    updateSpeed: 0.012,
  },

  // ── victory-confetti ─────────────────────────────────────────────────────
  'victory-confetti': {
    count: 80,
    minLife: 1.5,
    maxLife: 3.5,
    minSize: 0.06,
    maxSize: 0.18,
    emitBoxHalf: new Vector3(5.0, 0.1, 0.5),   // wide horizontal spread up high
    dir1: new Vector3(-0.5, -3.0, -0.2),
    dir2: new Vector3(0.5,  -0.5,  0.2),
    minPower: 0.5,
    maxPower: 2.0,
    gravity: HEAVY_GRAVITY,
    color1: new Color4(1.0, 0.2, 0.6, 1),   // magenta
    color2: new Color4(0.2, 0.8, 1.0, 1),   // cyan blue
    colorDead: new Color4(0.6, 0.6, 0.6, 0),
    blend: ParticleSystem.BLENDMODE_STANDARD,
    texture: 'square',
    updateSpeed: 0.01,
  },

  // ── character-aura ───────────────────────────────────────────────────────
  'character-aura': {
    count: 25,      // emitRate for continuous
    minLife: 0.6,
    maxLife: 1.2,
    minSize: 0.1,
    maxSize: 0.4,
    emitBoxHalf: new Vector3(0.5, 0.8, 0.5),
    dir1: new Vector3(-0.3, 0.5, -0.3),
    dir2: new Vector3(0.3,  2.0,  0.3),
    minPower: 0.2,
    maxPower: 0.8,
    gravity: LIFT_GRAVITY,
    // Overridden at runtime by character colour
    color1: new Color4(0.4, 0.6, 1.0, 0.7),
    color2: new Color4(0.6, 0.4, 1.0, 0.5),
    colorDead: new Color4(0.3, 0.3, 0.8, 0),
    blend: ParticleSystem.BLENDMODE_ADD,
    texture: 'flare',
    continuous: true,
    updateSpeed: 0.008,
  },

  // ── sweat ────────────────────────────────────────────────────────────────
  'sweat': {
    count: 8,
    minLife: 0.15,
    maxLife: 0.4,
    minSize: 0.03,
    maxSize: 0.1,
    emitBoxHalf: new Vector3(0.1, 0.05, 0.1),
    dir1: new Vector3(-1.0, 0.5, -0.8),
    dir2: new Vector3(1.0,  2.5,  0.8),
    minPower: 1.5,
    maxPower: 4.0,
    gravity: HEAVY_GRAVITY,
    color1: new Color4(0.6, 0.85, 1.0, 0.9),
    color2: new Color4(0.4, 0.7,  1.0, 0.7),
    colorDead: DEAD,
    blend: ParticleSystem.BLENDMODE_STANDARD,
    texture: 'flare',
    updateSpeed: 0.012,
  },

  // ── blood-energy ─────────────────────────────────────────────────────────
  'blood-energy': {
    count: 35,
    minLife: 0.3,
    maxLife: 0.65,
    minSize: 0.06,
    maxSize: 0.25,
    emitBoxHalf: new Vector3(0.1, 0.1, 0.1),
    dir1: new Vector3(-2.0, -0.5, -1.0),
    dir2: new Vector3(2.0,   3.0,  1.0),
    minPower: 2,
    maxPower: 9,
    gravity: MED_GRAVITY,
    // Overridden at runtime by character colour
    color1: new Color4(1.0, 0.1, 0.2, 1),
    color2: new Color4(0.8, 0.0, 0.1, 0.8),
    colorDead: DEAD,
    blend: ParticleSystem.BLENDMODE_ADD,
    texture: 'flare',
    updateSpeed: 0.01,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Pool entry
// ─────────────────────────────────────────────────────────────────────────────

interface PoolEntry {
  system: ParticleSystem | GPUParticleSystem
  inUse: boolean
  /** ID of the pending auto-return timer (if one-shot). */
  returnTimer: ReturnType<typeof setTimeout> | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Texture paths
// ─────────────────────────────────────────────────────────────────────────────

const TEXTURE_PATHS: Record<ParticleConfig['texture'], string> = {
  flare:  '/assets/textures/flare.png',
  square: '/assets/textures/particle_square.png',
  smoke:  '/assets/textures/smoke.png',
}

// ─────────────────────────────────────────────────────────────────────────────
// ParticleSystemManager
// ─────────────────────────────────────────────────────────────────────────────

const POOL_SIZE = 20

/** Maximum capacity allocated per pooled particle system. */
const MAX_CAPACITY = 512

export class ParticleSystemManager {
  private readonly scene: Scene
  private readonly pool: PoolEntry[] = []
  /** Shared textures — created once, reused across all pool entries. */
  private readonly textures: Record<ParticleConfig['texture'], Texture>
  private readonly useGPU: boolean

  constructor(scene: Scene) {
    this.scene = scene
    this.useGPU = GPUParticleSystem.IsSupported

    // ── Pre-load textures ──────────────────────────────────────────────────
    this.textures = {
      flare:  new Texture(TEXTURE_PATHS.flare,  scene),
      square: new Texture(TEXTURE_PATHS.square, scene),
      smoke:  new Texture(TEXTURE_PATHS.smoke,  scene),
    }

    // ── Pre-allocate pool ─────────────────────────────────────────────────
    for (let i = 0; i < POOL_SIZE; i++) {
      const system = this.createBareSystem(`pool_${i}`)
      this.pool.push({ system, inUse: false, returnTimer: null })
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Emit a one-shot particle burst at `position`.
   * The pooled system is automatically returned when the effect has expired.
   *
   * @param type     Particle effect preset name.
   * @param position World-space spawn position.
   * @param color    Optional hex string (e.g. '#FF4400') to tint the effect.
   *                 Relevant for 'super-explosion', 'blood-energy', 'character-aura'.
   */
  spawn(type: ParticleType, position: Vector3, color?: string): void {
    const entry = this.acquireEntry()
    if (!entry) return   // Pool exhausted — silently skip (never throw in render loop)

    const cfg = CONFIGS[type]
    this.configure(entry.system, cfg, position, color)

    // One-shot: emit exactly `count` particles then stop automatically.
    entry.system.manualEmitCount = cfg.count
    entry.system.start()

    // Schedule pool return after the effect has fully faded.
    const lifetimeMs = Math.ceil(cfg.maxLife * 1000) + 200  // +200ms buffer
    entry.returnTimer = setTimeout(() => {
      entry.system.stop()
      this.releaseEntry(entry)
    }, lifetimeMs)
  }

  /**
   * Start a continuous emitter at `position`.
   * Returns a handle with a `stop()` method; call it to extinguish the effect
   * and return the system to the pool.
   *
   * Continuous systems also have a safety auto-stop at 30 s to guard
   * against leaked handles (bug safety net).
   */
  spawnContinuous(
    type: ParticleType,
    position: Vector3,
    color?: string,
  ): ContinuousEmitterHandle {
    const entry = this.acquireEntry()

    // No pool slot available — return a no-op handle.
    if (!entry) {
      return { stop: () => { /* pool exhausted */ } }
    }

    const cfg = CONFIGS[type]
    this.configure(entry.system, cfg, position, color)

    // Continuous mode: use emitRate instead of manualEmitCount.
    entry.system.manualEmitCount = -1
    entry.system.emitRate = cfg.count

    entry.system.start()

    // Safety auto-stop after 30 s.
    const safetyTimer = setTimeout(() => {
      entry.system.stop()
      this.releaseEntry(entry)
    }, 30_000)

    let stopped = false

    return {
      stop: () => {
        if (stopped) return
        stopped = true
        clearTimeout(safetyTimer)
        entry.system.stop()
        // Allow existing particles to fade before returning.
        const cfg = CONFIGS[type]
        const fadeMs = Math.ceil(cfg.maxLife * 1000) + 100
        entry.returnTimer = setTimeout(() => this.releaseEntry(entry), fadeMs)
      },
    }
  }

  /**
   * Dispose all pooled systems and shared textures.
   * Call this when the game scene is torn down.
   */
  dispose(): void {
    for (const entry of this.pool) {
      if (entry.returnTimer) clearTimeout(entry.returnTimer)
      entry.system.dispose()
    }
    this.pool.length = 0
    ;(Object.values(this.textures) as Texture[]).forEach(t => t.dispose())
  }

  // ── Pool management ───────────────────────────────────────────────────────

  private acquireEntry(): PoolEntry | null {
    for (const entry of this.pool) {
      if (!entry.inUse) {
        entry.inUse = true
        return entry
      }
    }
    return null  // All 20 slots busy
  }

  private releaseEntry(entry: PoolEntry): void {
    if (entry.returnTimer) {
      clearTimeout(entry.returnTimer)
      entry.returnTimer = null
    }
    entry.system.reset()
    entry.inUse = false
  }

  // ── System factory & configuration ────────────────────────────────────────

  /**
   * Create a bare, unstarted particle system.
   * All rendering parameters are set later by configure().
   */
  private createBareSystem(name: string): ParticleSystem | GPUParticleSystem {
    if (this.useGPU) {
      return new GPUParticleSystem(name, { capacity: MAX_CAPACITY }, this.scene)
    }
    return new ParticleSystem(name, MAX_CAPACITY, this.scene)
  }

  /**
   * Apply all config values to a pooled system before starting it.
   * This is the only "hot" path executed per spawn call.
   */
  private configure(
    ps: ParticleSystem | GPUParticleSystem,
    cfg: ParticleConfig,
    position: Vector3,
    colorHex?: string,
  ): void {
    // Position
    ps.emitter = position.clone()

    // Texture (reuse pre-loaded shared texture — no GPU upload)
    ps.particleTexture = this.textures[cfg.texture]

    // Emit box
    ps.minEmitBox = cfg.emitBoxHalf.negate()
    ps.maxEmitBox = cfg.emitBoxHalf.clone()

    // Direction
    ps.direction1 = cfg.dir1.clone()
    ps.direction2 = cfg.dir2.clone()

    // Speed
    ps.minEmitPower = cfg.minPower
    ps.maxEmitPower = cfg.maxPower

    // Lifetime
    ps.minLifeTime = cfg.minLife
    ps.maxLifeTime = cfg.maxLife

    // Size
    ps.minSize = cfg.minSize
    ps.maxSize = cfg.maxSize

    // Gravity
    ps.gravity = cfg.gravity.clone()

    // Blending
    ps.blendMode = cfg.blend

    // Update speed
    ps.updateSpeed = cfg.updateSpeed ?? 0.01

    // ── Colours ───────────────────────────────────────────────────────────
    if (colorHex) {
      // Tint: parse the caller-provided colour and derive c1/c2/dead from it.
      const base = hexToColor4(colorHex, 1.0)
      // c1 = full colour, c2 = slightly desaturated / brighter
      ps.color1    = new Color4(
        clamp(base.r * 1.1, 0, 1),
        clamp(base.g * 1.1, 0, 1),
        clamp(base.b * 1.1, 0, 1),
        1,
      )
      ps.color2    = new Color4(base.r, base.g, base.b, 0.85)
      ps.colorDead = new Color4(base.r * 0.5, base.g * 0.5, base.b * 0.5, 0)
    } else {
      ps.color1    = cfg.color1.clone()
      ps.color2    = cfg.color2.clone()
      ps.colorDead = cfg.colorDead.clone()
    }

    // Rotation (subtle spin for visual variety)
    ps.minAngularSpeed = -Math.PI
    ps.maxAngularSpeed =  Math.PI

    // Ensure emitter rate fields are in a known state before the caller sets them.
    ps.emitRate = cfg.count
    ps.manualEmitCount = -1
  }
}
