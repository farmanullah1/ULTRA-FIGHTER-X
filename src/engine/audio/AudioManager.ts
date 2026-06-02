import { Howl } from 'howler'

export class AudioManager {
  private sfx: Map<string, Howl> = new Map()
  private music: Howl | null = null

  constructor() {
    this.loadSFX('hit', '/assets/sounds/hit.wav')
    this.loadSFX('block', '/assets/sounds/block.wav')
    this.loadSFX('swing', '/assets/sounds/swing.wav')
  }

  private loadSFX(name: string, path: string): void {
    this.sfx.set(name, new Howl({ src: [path] }))
  }

  playSFX(name: string, volume: number = 1.0): void {
    const sound = this.sfx.get(name)
    if (sound) {
      sound.volume(volume)
      sound.play()
    }
  }

  playMusic(path: string, volume: number = 0.5): void {
    if (this.music) this.music.stop()
    this.music = new Howl({
      src: [path],
      loop: true,
      volume
    })
    this.music.play()
  }

  setVolume(type: 'sfx' | 'music', val: number): void {
    if (type === 'music' && this.music) this.music.volume(val)
    if (type === 'sfx') {
      this.sfx.forEach(s => s.volume(val))
    }
  }
}
