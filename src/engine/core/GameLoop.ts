import { FRAME_TIME } from '@constants/gameConstants'

type LoopCallback = (deltaTime: number, frame: number) => void
type RenderCallback = (interpolation: number) => void

export class GameLoop {
  private animationId: number = 0
  private lastTime: number = 0
  private accumulator: number = 0
  private currentFrame: number = 0
  private isRunning: boolean = false
  private updateCallback: LoopCallback | null = null
  private renderCallback: RenderCallback | null = null
  private timeScale: number = 1.0

  // Deterministic fixed-timestep loop with interpolation
  start(
    onUpdate: LoopCallback,
    onRender: RenderCallback
  ): void {
    this.updateCallback = onUpdate
    this.renderCallback = onRender
    this.isRunning = true
    this.lastTime = performance.now()
    this.tick(this.lastTime)
  }

  setTimeScale(scale: number): void {
    this.timeScale = scale
  }

  stop(): void {
    this.isRunning = false
    cancelAnimationFrame(this.animationId)
  }

  private tick = (timestamp: number): void => {
    if (!this.isRunning) return

    const elapsed = Math.min(timestamp - this.lastTime, 100) * this.timeScale
    this.lastTime = timestamp
    this.accumulator += elapsed

    while (this.accumulator >= FRAME_TIME) {
      this.updateCallback?.(FRAME_TIME / 1000, this.currentFrame)
      this.currentFrame++
      this.accumulator -= FRAME_TIME
    }

    const interpolation = this.accumulator / FRAME_TIME
    this.renderCallback?.(interpolation)

    this.animationId = requestAnimationFrame(this.tick)
  }

  get frame(): number {
    return this.currentFrame
  }

  reset(): void {
    this.currentFrame = 0
    this.accumulator = 0
  }
}
