export class AudioManager {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private musicGain: GainNode | null = null
  
  // Music scheduling
  private musicIntervalId: any = null
  private currentTempo: number = 130
  private currentStageId: string = 'cyber-city'
  private currentStep: number = 0
  private currentMusicType: 'menu' | 'battle' | null = null

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser policies
  }

  private initContext(): void {
    if (this.context) return
    
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      this.context = new AudioCtx()
      
      this.masterGain = this.context.createGain()
      this.sfxGain = this.context.createGain()
      this.musicGain = this.context.createGain()
      
      this.sfxGain.connect(this.masterGain)
      this.musicGain.connect(this.masterGain)
      this.masterGain.connect(this.context.destination)
      
      this.masterGain.gain.value = 0.9
      this.sfxGain.gain.value = 0.8
      this.musicGain.gain.value = 0.4
    } catch (e) {
      console.error("Failed to initialize Web Audio API", e)
    }
  }

  resume(): void {
    this.initContext()
    if (this.context && this.context.state === 'suspended') {
      this.context.resume()
    }
  }

  playSFX(name: string, volumeScale: number = 1.0): void {
    this.resume()
    if (!this.context || !this.sfxGain) return

    if (name === 'hit') {
      this.playPunchSound(false, volumeScale)
    } else if (name === 'block') {
      this.playBlockSound(volumeScale)
    } else if (name === 'swing') {
      this.playSwingSound(volumeScale)
    } else if (name === 'super_activate') {
      this.playSuperActivateSound(volumeScale)
    } else if (name === 'super_impact') {
      this.playPunchSound(true, volumeScale * 1.5)
    } else if (name === 'ko') {
      this.playKOSound(volumeScale)
    } else if (name === 'menu_hover') {
      this.playMenuHoverSound(volumeScale)
    } else if (name === 'menu_select') {
      this.playMenuSelectSound(volumeScale)
    } else if (name === 'voice_grunt') {
      this.playVoiceGrunt(volumeScale)
    } else if (name === 'voice_shout') {
      this.playVoiceShout(volumeScale)
    } else if (name === 'super_chime') {
      this.playSuperActivateChime(volumeScale)
    } else if (name === 'barrier_shatter') {
      this.playBarrierShatterSound(volumeScale)
    } else {
      this.playSwingSound(volumeScale)
    }
  }

  playSpecial(characterId: string): void {
    this.resume()
    if (!this.context) return

    const soundMap: Record<string, () => void> = {
      'kai-storm': () => this.playElectricBurst(),
      'viper-x': () => this.playAcidHiss(),
      'iron-claw': () => this.playMetalCrunch(),
      'nova-star': () => this.playCosmicRumble(),
      'shadow-byte': () => this.playGlitchSound(),
      'phoenix-rise': () => this.playFireRoar(),
    }
    soundMap[characterId]?.()
  }

  private playPunchSound(heavy: boolean, scale: number): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime
    
    // Thud component (Low Sine frequency sweep)
    const osc = this.context.createOscillator()
    const oscGain = this.context.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(heavy ? 120 : 180, now)
    osc.frequency.exponentialRampToValueAtTime(heavy ? 30 : 50, now + (heavy ? 0.25 : 0.15))
    
    oscGain.gain.setValueAtTime(0.7 * scale, now)
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.25 : 0.15))
    
    osc.connect(oscGain)
    oscGain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + (heavy ? 0.26 : 0.16))

    // Friction component (Filtered white noise burst)
    const noise = this.createNoiseBurst(heavy ? 0.18 : 0.08)
    const filter = this.context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = heavy ? 250 : 400
    filter.Q.value = 3

    const noiseGain = this.context.createGain()
    noiseGain.gain.setValueAtTime(0.6 * scale, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.18 : 0.08))

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.sfxGain)
    noise.start(now)
    noise.stop(now + (heavy ? 0.2 : 0.1))
  }

  private playBlockSound(scale: number): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime

    // Short high metallic tone (Square/Triangle)
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(450, now)
    osc.frequency.linearRampToValueAtTime(800, now + 0.08)
    
    gain.gain.setValueAtTime(0.4 * scale, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.09)

    // Noise snap
    const noise = this.createNoiseBurst(0.04)
    const filter = this.context.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 2000

    const noiseGain = this.context.createGain()
    noiseGain.gain.setValueAtTime(0.5 * scale, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.sfxGain)
    noise.start(now)
    noise.stop(now + 0.05)
  }

  private playSwingSound(scale: number): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime

    // Sweeping bandpass noise
    const noise = this.createNoiseBurst(0.2)
    const filter = this.context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 2.5
    filter.frequency.setValueAtTime(900, now)
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.18)

    const gain = this.context.createGain()
    gain.gain.setValueAtTime(0.5 * scale, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    
    noise.start(now)
    noise.stop(now + 0.22)
  }

  private playSuperActivateSound(scale: number): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime

    // Rising siren effect
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(120, now)
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.6)

    gain.gain.setValueAtTime(0.5 * scale, now)
    gain.gain.linearRampToValueAtTime(0.8 * scale, now + 0.3)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    // Bandpass sweep
    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1500, now)
    filter.frequency.linearRampToValueAtTime(4000, now + 0.6)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)

    osc.start(now)
    osc.stop(now + 0.62)
  }

  private playKOSound(scale: number): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime

    // Ultra deep sub boom
    const sub = this.context.createOscillator()
    const subGain = this.context.createGain()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(70, now)
    sub.frequency.exponentialRampToValueAtTime(10, now + 1.2)

    subGain.gain.setValueAtTime(1.0 * scale, now)
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)

    sub.connect(subGain)
    subGain.connect(this.sfxGain)
    sub.start(now)
    sub.stop(now + 1.25)

    // Dark noise explosion
    const noise = this.createNoiseBurst(0.8)
    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(400, now)
    filter.frequency.exponentialRampToValueAtTime(30, now + 0.8)

    const noiseGain = this.context.createGain()
    noiseGain.gain.setValueAtTime(0.7 * scale, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.sfxGain)
    noise.start(now)
    noise.stop(now + 0.85)
  }

  private playMenuHoverSound(scale: number): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(900, now)
    osc.frequency.exponentialRampToValueAtTime(1300, now + 0.04)
    
    gain.gain.setValueAtTime(0.12 * scale, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
    
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.05)
  }

  private playMenuSelectSound(scale: number): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime
    
    const notes = [523.25, 659.25] // C5, E5
    notes.forEach((freq, idx) => {
      const osc = this.context!.createOscillator()
      const gain = this.context!.createGain()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.03)
      
      gain.gain.setValueAtTime(0.2 * scale, now + idx * 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + idx * 0.03)
      
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(now + idx * 0.03)
      osc.stop(now + 0.25 + idx * 0.03)
    })
  }

  private playElectricBurst(): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime
    
    for (let i = 0; i < 6; i++) {
      const time = now + i * 0.05
      const osc = this.context.createOscillator()
      const gain = this.context.createGain()
      osc.type = 'triangle'
      osc.frequency.value = 1200 + Math.random() * 1500
      
      gain.gain.setValueAtTime(0.25, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06)
      
      osc.connect(gain)
      gain.connect(this.sfxGain)
      osc.start(time)
      osc.stop(time + 0.07)
    }
  }

  private playAcidHiss(): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime
    
    const noise = this.createNoiseBurst(0.5)
    const filter = this.context.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 3500

    const gain = this.context.createGain()
    gain.gain.setValueAtTime(0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    noise.start(now)
    noise.stop(now + 0.52)
  }

  private playMetalCrunch(): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime

    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(90, now)
    osc.frequency.linearRampToValueAtTime(30, now + 0.3)

    gain.gain.setValueAtTime(0.8, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    const waveshaper = this.context.createWaveShaper()
    const makeDistortionCurve = (amount = 20) => {
      const k = typeof amount === 'number' ? amount : 50
      const n_samples = 44100
      const curve = new Float32Array(n_samples)
      const deg = Math.PI / 180
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x))
      }
      return curve
    }
    waveshaper.curve = makeDistortionCurve()
    waveshaper.oversample = '4x'

    osc.connect(waveshaper)
    waveshaper.connect(gain)
    gain.connect(this.sfxGain)

    osc.start(now)
    osc.stop(now + 0.36)
  }

  private playCosmicRumble(): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime

    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(80, now)
    osc.frequency.linearRampToValueAtTime(140, now + 0.4)

    gain.gain.setValueAtTime(0.6, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

    const modulator = this.context.createOscillator()
    const modGain = this.context.createGain()
    modulator.type = 'sine'
    modulator.frequency.value = 15
    modGain.gain.value = 30

    modulator.connect(modGain)
    modGain.connect(osc.frequency)
    
    osc.connect(gain)
    gain.connect(this.sfxGain)

    modulator.start(now)
    osc.start(now)
    modulator.stop(now + 0.46)
    osc.stop(now + 0.46)
  }

  private playGlitchSound(): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime
    
    for (let i = 0; i < 4; i++) {
      const start = now + i * 0.06
      const dur = 0.04
      const osc = this.context.createOscillator()
      const gain = this.context.createGain()
      
      osc.type = 'square'
      osc.frequency.value = 500 + Math.random() * 2000
      gain.gain.setValueAtTime(0.15, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
      
      osc.connect(gain)
      gain.connect(this.sfxGain)
      osc.start(start)
      osc.stop(start + dur + 0.01)
    }
  }

  private playFireRoar(): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime

    const noise = this.createNoiseBurst(0.6)
    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(900, now)
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.5)

    const gain = this.context.createGain()
    gain.gain.setValueAtTime(0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    noise.start(now)
    noise.stop(now + 0.62)
  }

  startBattleMusic(stageTheme: string): void {
    this.resume()
    if (this.currentMusicType === 'battle' && this.currentStageId === stageTheme) return
    this.stopMusic()
    
    this.currentMusicType = 'battle'
    this.currentStageId = stageTheme
    this.currentTempo = { 'cyber-city': 135, 'volcano': 120, 'space-station': 125, 'neon-dojo': 130 }[stageTheme] ?? 130
    this.currentStep = 0
    
    const intervalTime = (60 / this.currentTempo) / 4 // 16th notes
    this.musicIntervalId = setInterval(() => {
      this.playSequencerStep()
      this.currentStep++
    }, intervalTime * 1000)
  }

  startMenuMusic(): void {
    this.resume()
    if (this.currentMusicType === 'menu') return
    this.stopMusic()
    
    this.currentMusicType = 'menu'
    this.currentTempo = 100
    this.currentStep = 0
    
    const intervalTime = (60 / this.currentTempo) / 4 // 16th notes
    this.musicIntervalId = setInterval(() => {
      this.playSequencerStep()
      this.currentStep++
    }, intervalTime * 1000)
  }

  stopMusic(): void {
    if (this.musicIntervalId) {
      clearInterval(this.musicIntervalId)
      this.musicIntervalId = null
    }
    this.currentMusicType = null
  }

  stopMenuMusic(): void {
    if (this.currentMusicType === 'menu') {
      this.stopMusic()
    }
  }

  private playSequencerStep(): void {
    if (!this.context || !this.musicGain) return
    const now = this.context.currentTime

    const stepInBar = this.currentStep % 16

    if (this.currentMusicType === 'menu') {
      // 1. Chill D-minor arpeggiators and low kick drums
      if (stepInBar === 0 || stepInBar === 8) {
        this.playSynthKick(now)
      }
      if (stepInBar === 4 || stepInBar === 12) {
        this.playSynthHihat(now, true)
      } else if (stepInBar % 2 === 1 && Math.random() > 0.45) {
        this.playSynthHihat(now, false)
      }

      // Deep rolling chord bass
      const roots = [36.71, 36.71, 43.65, 41.20] // D, D, F, E roots
      const rootHz = roots[Math.floor(this.currentStep / 8) % roots.length]

      if (stepInBar % 2 === 0) {
        const osc = this.context.createOscillator()
        const gain = this.context.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(rootHz, now)
        
        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

        const lowpass = this.context.createBiquadFilter()
        lowpass.type = 'lowpass'
        lowpass.frequency.value = 180

        osc.connect(lowpass)
        lowpass.connect(gain)
        gain.connect(this.musicGain)

        osc.start(now)
        osc.stop(now + 0.3)
      }

      // Spacey soft arpeggio sweep (D minor: D4, F4, A4, C5)
      const arpeggioNotes = [293.66, 349.23, 440.00, 523.25]
      const noteHz = arpeggioNotes[this.currentStep % arpeggioNotes.length]

      if (stepInBar % 2 === 1) {
        const osc = this.context.createOscillator()
        const gain = this.context.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(noteHz, now)

        gain.gain.setValueAtTime(0.08, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)

        osc.connect(gain)
        gain.connect(this.musicGain)

        osc.start(now)
        osc.stop(now + 0.3)
      }
    } else {
      // 1. Kick Drum: step 0, 4, 8, 12
      if (stepInBar === 0 || stepInBar === 8 || (stepInBar === 11 && this.currentStageId === 'cyber-city') || stepInBar === 12) {
        this.playSynthKick(now)
      }

      // 2. Snare/Clap Drum: step 4, 12
      if (stepInBar === 4 || stepInBar === 12) {
        this.playSynthSnare(now)
      }

      // 3. Hihat: odd steps
      if (stepInBar % 2 === 1) {
        this.playSynthHihat(now, stepInBar % 4 === 3)
      }

      // 4. Bassline: customized to stage theme
      this.playBasslineStep(now, stepInBar)
    }
  }

  private playSynthKick(time: number): void {
    if (!this.context || !this.musicGain) return
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(130, time)
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12)

    gain.gain.setValueAtTime(0.7, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)

    osc.connect(gain)
    gain.connect(this.musicGain)
    osc.start(time)
    osc.stop(time + 0.13)
  }

  private playSynthSnare(time: number): void {
    if (!this.context || !this.musicGain) return
    
    const noise = this.createNoiseBurst(0.12)
    const filter = this.context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1000

    const noiseGain = this.context.createGain()
    noiseGain.gain.setValueAtTime(0.3, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.musicGain)
    
    noise.start(time)
    noise.stop(time + 0.14)
  }

  private playSynthHihat(time: number, accent: boolean): void {
    if (!this.context || !this.musicGain) return
    const noise = this.createNoiseBurst(accent ? 0.05 : 0.02)
    const filter = this.context.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 7000

    const gain = this.context.createGain()
    gain.gain.setValueAtTime(accent ? 0.15 : 0.06, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + (accent ? 0.05 : 0.02))

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.musicGain)
    noise.start(time)
    noise.stop(time + 0.06)
  }

  private playBasslineStep(time: number, step: number): void {
    if (!this.context || !this.musicGain) return

    const roots = {
      'cyber-city': [55.0, 55.0, 65.4, 48.99],
      'volcano': [41.2, 41.2, 43.65, 38.89],
      'space-station': [32.7, 38.89, 48.99, 43.65],
      'neon-dojo': [48.99, 58.27, 58.27, 43.65]
    }
    const rootNotes = roots[this.currentStageId as keyof typeof roots] || roots['cyber-city']
    const rootHz = rootNotes[Math.floor(step / 4) % rootNotes.length]

    let multiplier = 1
    if (step % 4 === 1) multiplier = 1.5
    if (step % 4 === 2) multiplier = 1.2
    if (step % 8 === 7) multiplier = 2.0

    const triggerMap = [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1]
    if (triggerMap[step] === 0) return

    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    
    osc.type = this.currentStageId === 'cyber-city' ? 'sawtooth' : 'triangle'
    osc.frequency.setValueAtTime(rootHz * multiplier, time)

    const duration = 0.15
    gain.gain.setValueAtTime(0.18, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

    const lowpass = this.context.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 350

    osc.connect(lowpass)
    lowpass.connect(gain)
    gain.connect(this.musicGain)

    osc.start(time)
    osc.stop(time + duration + 0.01)
  }

  setVolume(type: 'sfx' | 'music' | 'master', val: number): void {
    this.resume()
    if (!this.context) return
    const gainNode = type === 'master' ? this.masterGain : (type === 'music' ? this.musicGain : this.sfxGain)
    if (gainNode) {
      gainNode.gain.setTargetAtTime(val, this.context.currentTime, 0.01)
    }
  }

  private createNoiseBurst(duration: number): AudioBufferSourceNode {
    const rate = this.context!.sampleRate
    const length = rate * duration
    const buffer = this.context!.createBuffer(1, length, rate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const source = this.context!.createBufferSource()
    source.buffer = buffer
    return source
  }

  private playVoiceGrunt(scale: number): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.12)
    
    gain.gain.setValueAtTime(0.35 * scale, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    
    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 350
    
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.13)
  }

  private playVoiceShout(scale: number): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(160, now)
    osc.frequency.linearRampToValueAtTime(110, now + 0.25)
    
    gain.gain.setValueAtTime(0.4 * scale, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
    
    const filter = this.context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(600, now)
    filter.frequency.linearRampToValueAtTime(300, now + 0.25)
    filter.Q.value = 2.0
    
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.26)
  }

  private playSuperActivateChime(scale: number): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime
    const notes = [659.25, 783.99, 987.77, 1318.51] // E5, G5, B5, E6
    notes.forEach((freq, idx) => {
      const osc = this.context!.createOscillator()
      const gain = this.context!.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.06)
      
      gain.gain.setValueAtTime(0.18 * scale, now + idx * 0.06)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + idx * 0.06)
      
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(now + idx * 0.06)
      osc.stop(now + 0.3 + idx * 0.06)
    })
  }

  private playBarrierShatterSound(scale: number): void {
    if (!this.context || !this.sfxGain) return
    const now = this.context.currentTime

    const osc1 = this.context.createOscillator()
    const osc2 = this.context.createOscillator()
    const gain = this.context.createGain()
    osc1.type = 'triangle'
    osc1.frequency.setValueAtTime(1800, now)
    osc1.frequency.exponentialRampToValueAtTime(300, now + 0.35)

    osc2.type = 'sawtooth'
    osc2.frequency.setValueAtTime(2200, now)
    osc2.frequency.exponentialRampToValueAtTime(600, now + 0.25)

    gain.gain.setValueAtTime(0.4 * scale, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    const filter1 = this.context.createBiquadFilter()
    filter1.type = 'highpass'
    filter1.frequency.value = 1000

    osc1.connect(filter1)
    osc2.connect(filter1)
    filter1.connect(gain)
    gain.connect(this.sfxGain)

    osc1.start(now)
    osc1.stop(now + 0.4)
    osc2.start(now)
    osc2.stop(now + 0.3)

    const noise = this.createNoiseBurst(0.3)
    const filter2 = this.context.createBiquadFilter()
    filter2.type = 'bandpass'
    filter2.frequency.value = 1500
    filter2.Q.value = 2.0

    const noiseGain = this.context.createGain()
    noiseGain.gain.setValueAtTime(0.5 * scale, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    noise.connect(filter2)
    filter2.connect(noiseGain)
    noiseGain.connect(this.sfxGain)

    noise.start(now)
    noise.stop(now + 0.4)
  }
}

export const audioManager = new AudioManager()
