import type { InputState, InputBuffer } from '@game-types/input.types'
import type { ControlMap } from '@game-types/game.types'
import { INPUT_BUFFER_SIZE } from '@constants/gameConstants'

const EMPTY_INPUT: InputState = {
  left: false, right: false, up: false, down: false,
  punch: false, kick: false, heavyPunch: false, heavyKick: false,
  special: false, super: false, block: false, dash: false,
}

export class InputManager {
  private pressedKeys: Set<string> = new Set()
  private player1State: InputState = { ...EMPTY_INPUT }
  private player2State: InputState = { ...EMPTY_INPUT }
  private p1Buffer: InputBuffer = { frames: [], maxLength: INPUT_BUFFER_SIZE }
  private p2Buffer: InputBuffer = { frames: [], maxLength: INPUT_BUFFER_SIZE }
  private controls: { player1: ControlMap; player2: ControlMap }

  // Gamepad support
  private gamepads: (Gamepad | null)[] = []

  constructor(controls: { player1: ControlMap; player2: ControlMap }) {
    this.controls = controls
    this.bindListeners()
  }

  private bindListeners(): void {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('gamepadconnected', this.onGamepadConnected)
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected)
  }

  unbind(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('gamepadconnected', this.onGamepadConnected)
    window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected)
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.pressedKeys.add(e.code)
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    this.pressedKeys.delete(e.code)
  }

  private onGamepadConnected = (e: GamepadEvent): void => {
    this.gamepads[e.gamepad.index] = e.gamepad
    console.log(`Gamepad connected: ${e.gamepad.id}`)
  }

  private onGamepadDisconnected = (e: GamepadEvent): void => {
    this.gamepads[e.gamepad.index] = null
  }

  update(frame: number): void {
    this.pollGamepads()
    
    this.player1State = this.buildInputState(this.controls.player1, 0)
    this.player2State = this.buildInputState(this.controls.player2, 1)

    this.pushToBuffer(this.p1Buffer, this.player1State, frame)
    this.pushToBuffer(this.p2Buffer, this.player2State, frame)
  }

  private pollGamepads(): void {
    const pads = navigator.getGamepads()
    this.gamepads = Array.from(pads)
  }

  private buildInputState(map: ControlMap, gamepadIndex: number): InputState {
    const pad = this.gamepads[gamepadIndex]
    const state: InputState = { ...EMPTY_INPUT }

    // Keyboard
    state.left = this.pressedKeys.has(map.left)
    state.right = this.pressedKeys.has(map.right)
    state.up = this.pressedKeys.has(map.up)
    state.down = this.pressedKeys.has(map.down)
    state.punch = this.pressedKeys.has(map.punch)
    state.kick = this.pressedKeys.has(map.kick)
    state.heavyPunch = this.pressedKeys.has(map.heavyPunch)
    state.heavyKick = this.pressedKeys.has(map.heavyKick)
    state.special = this.pressedKeys.has(map.special)
    state.super = this.pressedKeys.has(map.super)
    state.block = this.pressedKeys.has(map.block)
    state.dash = this.pressedKeys.has(map.dash)

    // Gamepad overlay
    if (pad) {
      const axes = pad.axes
      const btns = pad.buttons
      state.left = state.left || axes[0] < -0.5 || btns[14]?.pressed
      state.right = state.right || axes[0] > 0.5 || btns[15]?.pressed
      state.up = state.up || axes[1] < -0.5 || btns[12]?.pressed
      state.down = state.down || axes[1] > 0.5 || btns[13]?.pressed
      state.punch = state.punch || btns[0]?.pressed
      state.kick = state.kick || btns[2]?.pressed
      state.heavyPunch = state.heavyPunch || btns[1]?.pressed
      state.heavyKick = state.heavyKick || btns[3]?.pressed
      state.special = state.special || (btns[4]?.pressed ?? false)
      state.super = state.super || (btns[5]?.pressed ?? false)
      state.block = state.block || (btns[7]?.pressed ?? false)
    }

    return state
  }

  private pushToBuffer(buffer: InputBuffer, state: InputState, frame: number): void {
    buffer.frames.push({ state: { ...state }, frame, timestamp: performance.now() })
    if (buffer.frames.length > buffer.maxLength) {
      buffer.frames.shift()
    }
  }

  getPlayer1Input(): InputState { return this.player1State }
  getPlayer2Input(): InputState { return this.player2State }
  getP1Buffer(): InputBuffer { return this.p1Buffer }
  getP2Buffer(): InputBuffer { return this.p2Buffer }

  // Check if a sequence was performed within the last N frames
  checkInputSequence(
    buffer: InputBuffer,
    sequence: string[],
    windowFrames: number = 30
  ): boolean {
    if (buffer.frames.length < sequence.length) return false

    const recent = buffer.frames.slice(-windowFrames)
    let seqIdx = sequence.length - 1 // Start from the end of the sequence (the button press)
    
    // The last input MUST be the button press or the final direction
    const lastFrame = recent[recent.length - 1].state
    if (!this.matchesInputToken(lastFrame, sequence[seqIdx])) return false
    
    seqIdx-- // Move to the previous part of the sequence

    // Iterate backwards through the buffer to find the rest of the sequence
    for (let i = recent.length - 2; i >= 0; i--) {
      if (seqIdx < 0) return true // Sequence completed!

      const frame = recent[i].state
      if (this.matchesInputToken(frame, sequence[seqIdx])) {
        seqIdx--
      }
    }

    return seqIdx < 0
  }

  private matchesInputToken(input: InputState, token: string): boolean {
    const map: Record<string, (i: InputState) => boolean> = {
      'P': i => i.punch,
      'K': i => i.kick,
      'HP': i => i.heavyPunch,
      'HK': i => i.heavyKick,
      'D': i => i.down && !i.left && !i.right,
      'U': i => i.up,
      'F': i => i.right,
      'B': i => i.left,
      'DF': i => i.down && i.right,
      'DB': i => i.down && i.left,
      'S': i => i.special,
    }
    return map[token]?.(input) ?? false
  }
}
