export const CANVAS_WIDTH = 1920
export const CANVAS_HEIGHT = 1080
export const GAME_SCALE = 1
export const FLOOR_Y = 0
export const WALL_LEFT = -15
export const WALL_RIGHT = 15
export const GRAVITY = -0.015
export const MAX_FALL_SPEED = -0.5
export const TARGET_FPS = 60
export const FRAME_TIME = 1000 / TARGET_FPS

export const ROUND_TIME_DEFAULT = 99
export const ROUNDS_TO_WIN = 2
export const STARTING_HEALTH = 1000
export const STARTING_METER = 0
export const MAX_METER = 1000
export const METER_PER_HIT_DEALT = 40
export const METER_PER_HIT_RECEIVED = 20

export const HIT_STOP_FRAMES_LIGHT = 4
export const HIT_STOP_FRAMES_HEAVY = 8
export const HIT_STOP_FRAMES_SPECIAL = 12
export const HIT_STOP_FRAMES_SUPER = 20

export const SUPER_FLASH_DURATION = 60  // frames
export const ROUND_START_DELAY = 90     // frames
export const KO_FREEZE_DURATION = 120   // frames

export const COMBO_WINDOW = 60          // frames between hits to count as combo
export const INPUT_BUFFER_SIZE = 30     // frames to store input history

export const CAMERA_ZOOM_MIN = 5
export const CAMERA_ZOOM_MAX = 12
export const CAMERA_FOLLOW_SPEED = 0.08

export const DEFAULT_CONTROLS_P1 = {
  left: 'KeyA',
  right: 'KeyD',
  up: 'KeyW',
  down: 'KeyS',
  punch: 'KeyU',
  kick: 'KeyI',
  heavyPunch: 'KeyO',
  heavyKick: 'KeyP',
  special: 'KeyJ',
  super: 'KeyK',
  block: 'KeyL',
  dash: 'ShiftLeft',
}

export const DEFAULT_CONTROLS_P2 = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
  punch: 'Numpad4',
  kick: 'Numpad5',
  heavyPunch: 'Numpad6',
  heavyKick: 'Numpad1',
  special: 'Numpad2',
  super: 'Numpad3',
  block: 'Numpad0',
  dash: 'ShiftRight',
}
