export interface InputState {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  punch: boolean
  kick: boolean
  heavyPunch: boolean
  heavyKick: boolean
  special: boolean
  super: boolean
  block: boolean
  dash: boolean
}

export interface InputFrame {
  state: InputState
  frame: number
  timestamp: number
}

export interface InputBuffer {
  frames: InputFrame[]
  maxLength: number
}

export type InputEvent = {
  type: 'keydown' | 'keyup' | 'gamepad'
  key: string
  player: 1 | 2
  timestamp: number
}
