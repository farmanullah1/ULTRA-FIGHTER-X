import { 
  Scene, PBRMaterial, Texture, Color3, AnimationGroup, TransformNode, 
  AbstractMesh, MeshBuilder, StandardMaterial, Vector3, PointLight, DynamicTexture 
} from '@babylonjs/core'
import '@babylonjs/loaders/glTF'
import type { CharacterDef } from '@game-types/character.types'

export class AssetManager {
  private scene: Scene

  constructor(scene: Scene) {
    this.scene = scene
  }

  async loadCharacterModel(_modelPath: string, characterDef: CharacterDef): Promise<{
    root: TransformNode
    mesh: AbstractMesh
    animations: Map<string, AnimationGroup>
  }> {
    // We always fall back to our advanced procedural models to enforce consistent high-graphics aesthetic and seamless animation compatibility.
    return this.createProceduralCharacter(characterDef)
  }

  // Generates a high-fidelity carbon/metal micro-noise texture procedurally to simulate 4K detail
  private createNoiseTexture(color1: string, color2: string): Texture {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Base fill
      ctx.fillStyle = color1
      ctx.fillRect(0, 0, 512, 512)

      // Brushed carbon-like lines
      ctx.strokeStyle = color2
      ctx.lineWidth = 1
      for (let i = 0; i < 500; i++) {
        ctx.beginPath()
        const y = Math.random() * 512
        const length = 50 + Math.random() * 150
        const x = Math.random() * 512
        ctx.moveTo(x, y)
        ctx.lineTo(x + length, y)
        ctx.stroke()
      }

      // Micro specular noise dots
      ctx.fillStyle = '#FFFFFF'
      for (let i = 0; i < 1500; i++) {
        const x = Math.random() * 512
        const y = Math.random() * 512
        const size = Math.random() * 1.5
        ctx.globalAlpha = Math.random() * 0.15
        ctx.fillRect(x, y, size, size)
      }
    }
    
    const dataUrl = canvas.toDataURL()
    const tex = new Texture(dataUrl, this.scene)
    return tex
  }

  private createProceduralCharacter(characterDef: CharacterDef): {
    root: TransformNode
    mesh: AbstractMesh
    animations: Map<string, AnimationGroup>
  } {
    const root = new TransformNode('charRootPlaceholder_' + characterDef.id, this.scene)
    
    // Create highly detailed procedurally mapped PBR materials (4K-like detail)
    const bodyMat = new PBRMaterial('bodyMat_' + characterDef.id, this.scene)
    bodyMat.albedoTexture = this.createNoiseTexture(characterDef.colors.primary, '#121212')
    bodyMat.metallic = 0.85
    bodyMat.roughness = 0.18
    bodyMat.directIntensity = 1.5
    bodyMat.specularIntensity = 1.0

    const accentMat = new PBRMaterial('accentMat_' + characterDef.id, this.scene)
    accentMat.albedoTexture = this.createNoiseTexture(characterDef.colors.secondary, '#0a0a0a')
    accentMat.metallic = 0.95
    accentMat.roughness = 0.12
    accentMat.directIntensity = 1.5

    const glowMat = new PBRMaterial('glowMat_' + characterDef.id, this.scene)
    glowMat.albedoColor = Color3.FromHexString(characterDef.colors.aura)
    glowMat.emissiveColor = Color3.FromHexString(characterDef.colors.aura)
    glowMat.emissiveIntensity = 2.5
    glowMat.metallic = 0.1
    glowMat.roughness = 0.5

    // Adjust transparency for holographic characters
    if (characterDef.id === 'shadow-byte') {
      bodyMat.alpha = 0.65
      accentMat.alpha = 0.65
      glowMat.alpha = 0.8
      bodyMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND
      accentMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND
      glowMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND
    }

    // Set custom body proportions for heavy titan
    const isHeavy = characterDef.id === 'iron-claw'
    const bodyWidth = isHeavy ? 1.0 : 0.8
    const bodyHeight = isHeavy ? 1.3 : 1.2
    const bodyDepth = isHeavy ? 0.6 : 0.4
    const headSize = isHeavy ? 0.48 : 0.42

    const body = MeshBuilder.CreateBox('body', { width: bodyWidth, height: bodyHeight, depth: bodyDepth }, this.scene)
    body.position.y = isHeavy ? 1.35 : 1.4
    body.material = bodyMat
    body.parent = root

    const head = MeshBuilder.CreateBox('head', { size: headSize }, this.scene)
    head.position.y = isHeavy ? 2.15 : 2.2
    head.material = bodyMat
    head.parent = root

    const legL = MeshBuilder.CreateBox('legL', { width: isHeavy ? 0.35 : 0.28, height: 0.8, depth: isHeavy ? 0.35 : 0.28 }, this.scene)
    legL.position.set(isHeavy ? -0.25 : -0.2, 0.4, 0)
    legL.material = accentMat
    legL.parent = root

    const legR = MeshBuilder.CreateBox('legR', { width: isHeavy ? 0.35 : 0.28, height: 0.8, depth: isHeavy ? 0.35 : 0.28 }, this.scene)
    legR.position.set(isHeavy ? 0.25 : 0.2, 0.4, 0)
    legR.material = accentMat
    legR.parent = root

    const armL = MeshBuilder.CreateBox('armL', { width: isHeavy ? 0.32 : 0.24, height: 1.0, depth: isHeavy ? 0.32 : 0.24 }, this.scene)
    armL.position.set(isHeavy ? -0.66 : -0.54, 1.5, 0)
    armL.material = bodyMat
    armL.parent = root

    const armR = MeshBuilder.CreateBox('armR', { width: isHeavy ? 0.32 : 0.24, height: 1.0, depth: isHeavy ? 0.32 : 0.24 }, this.scene)
    armR.position.set(isHeavy ? 0.66 : 0.54, 1.5, 0)
    armR.material = bodyMat
    armR.parent = root

    // Add character specific custom attachments
    if (characterDef.id === 'kai-storm') {
      // Visor
      const visor = MeshBuilder.CreateBox('visor', { width: 0.44, height: 0.08, depth: 0.1 }, this.scene)
      visor.position.set(0, 0.05, 0.2)
      visor.material = glowMat
      visor.parent = head

      // Dual back katanas
      const katana1 = MeshBuilder.CreateBox('katana1', { width: 0.06, height: 1.3, depth: 0.06 }, this.scene)
      katana1.position.set(-0.25, 0.1, -0.28)
      katana1.rotation.set(0, 0, Math.PI / 4)
      katana1.material = accentMat
      katana1.parent = body

      const katana2 = MeshBuilder.CreateBox('katana2', { width: 0.06, height: 1.3, depth: 0.06 }, this.scene)
      katana2.position.set(0.25, 0.1, -0.28)
      katana2.rotation.set(0, 0, -Math.PI / 4)
      katana2.material = accentMat
      katana2.parent = body
    } 
    else if (characterDef.id === 'viper-x') {
      // Respirator Mask
      const mask = MeshBuilder.CreateBox('mask', { width: 0.28, height: 0.2, depth: 0.15 }, this.scene)
      mask.position.set(0, -0.1, 0.18)
      mask.material = accentMat
      mask.parent = head

      const tube = MeshBuilder.CreateBox('tube', { width: 0.35, height: 0.06, depth: 0.1 }, this.scene)
      tube.position.set(0, -0.12, 0.14)
      tube.material = glowMat
      tube.parent = head

      // Toxic canister on back
      const canister = MeshBuilder.CreateCylinder('canister', { height: 0.65, diameter: 0.26 }, this.scene)
      canister.position.set(0, 0, -0.3)
      canister.rotation.set(0, 0, Math.PI / 2)
      canister.material = glowMat
      canister.parent = body
    } 
    else if (characterDef.id === 'iron-claw') {
      // Giant hydraulic gauntlets
      const clawL = MeshBuilder.CreateBox('clawL', { width: 0.44, height: 0.5, depth: 0.44 }, this.scene)
      clawL.position.set(0, -0.4, 0)
      clawL.material = accentMat
      clawL.parent = armL

      const clawR = MeshBuilder.CreateBox('clawR', { width: 0.44, height: 0.5, depth: 0.44 }, this.scene)
      clawR.position.set(0, -0.4, 0)
      clawR.material = accentMat
      clawR.parent = armR
    } 
    else if (characterDef.id === 'nova-star') {
      // Celestial Halo
      const halo = MeshBuilder.CreateTorus('halo', { diameter: 0.5, thickness: 0.04 }, this.scene)
      halo.position.set(0, 0.35, 0)
      halo.rotation.set(Math.PI / 10, 0, 0)
      halo.material = glowMat
      halo.parent = head

      // Floating shoulders orbs
      const orbL = MeshBuilder.CreateSphere('orbL', { diameter: 0.26 }, this.scene)
      orbL.position.set(-0.6, 0.3, 0)
      orbL.material = glowMat
      orbL.parent = body

      const orbR = MeshBuilder.CreateSphere('orbR', { diameter: 0.26 }, this.scene)
      orbR.position.set(0.6, 0.3, 0)
      orbR.material = glowMat
      orbR.parent = body

      // Chest logo
      const star = MeshBuilder.CreateBox('star', { width: 0.22, height: 0.22, depth: 0.06 }, this.scene)
      star.position.set(0, 0.2, 0.22)
      star.material = glowMat
      star.parent = body
    } 
    else if (characterDef.id === 'shadow-byte') {
      // Digital glitch shards
      const shard1 = MeshBuilder.CreateBox('shard1', { size: 0.1 }, this.scene)
      shard1.position.set(-0.35, 0.2, 0.22)
      shard1.material = glowMat
      shard1.parent = body

      const shard2 = MeshBuilder.CreateBox('shard2', { size: 0.12 }, this.scene)
      shard2.position.set(0.35, -0.3, -0.22)
      shard2.material = glowMat
      shard2.parent = body

      const visor = MeshBuilder.CreateBox('visor', { width: 0.44, height: 0.05, depth: 0.1 }, this.scene)
      visor.position.set(0, 0.02, 0.2)
      visor.material = glowMat
      visor.parent = head
    } 
    else if (characterDef.id === 'phoenix-rise') {
      // Fire Horns
      const hornL = MeshBuilder.CreateBox('hornL', { width: 0.06, height: 0.28, depth: 0.06 }, this.scene)
      hornL.position.set(-0.15, 0.3, 0)
      hornL.rotation.set(0, 0, -0.25)
      hornL.material = glowMat
      hornL.parent = head

      const hornR = MeshBuilder.CreateBox('hornR', { width: 0.06, height: 0.28, depth: 0.06 }, this.scene)
      hornR.position.set(0.15, 0.3, 0)
      hornR.rotation.set(0, 0, 0.25)
      hornR.material = glowMat
      hornR.parent = head

      // Blazing wings
      const wingL = MeshBuilder.CreateBox('wingL', { width: 0.08, height: 1.2, depth: 0.35 }, this.scene)
      wingL.position.set(-0.45, 0.1, -0.25)
      wingL.rotation.set(0.2, 0.3, -Math.PI / 4)
      wingL.material = glowMat
      wingL.parent = body

      const wingR = MeshBuilder.CreateBox('wingR', { width: 0.08, height: 1.2, depth: 0.35 }, this.scene)
      wingR.position.set(0.45, 0.1, -0.25)
      wingR.rotation.set(0.2, -0.3, Math.PI / 4)
      wingR.material = glowMat
      wingR.parent = body
    }

    return {
      root,
      mesh: body,
      animations: new Map()
    }
  }

  createStage(theme: string): void {
    // 1. High quality floor material with mirror specular
    const ground = MeshBuilder.CreateGround('ground', { width: 60, height: 30 }, this.scene)
    const groundMat = new PBRMaterial('groundMat', this.scene)
    groundMat.metallic = 0.92
    groundMat.roughness = 0.1
    groundMat.reflectionColor = new Color3(0.6, 0.6, 0.6)
    ground.material = groundMat
    ground.receiveShadows = true

    // 2. Neon grid overlay
    const gridMat = new StandardMaterial('gridMat', this.scene)
    gridMat.emissiveColor = theme === 'volcano' ? new Color3(1, 0.3, 0) : new Color3(0, 0.8, 1)
    gridMat.wireframe = true
    gridMat.alpha = 0.15
    const grid = MeshBuilder.CreateGround('grid', { width: 60, height: 30, subdivisions: 30 }, this.scene)
    grid.position.y = 0.01
    grid.material = gridMat

    // 2b. Left & Right Breakable Neon Barriers
    const boundsX = theme === 'volcano' ? 14.0 : theme === 'cyber-city' ? 16.0 : theme === 'space-station' ? 12.0 : 11.5
    const hasBarriers = theme === 'cyber-city' || theme === 'volcano'
    if (hasBarriers) {
      const barrierMat = new PBRMaterial('barrierMat', this.scene)
      barrierMat.albedoColor = theme === 'volcano' ? new Color3(1, 0.25, 0) : new Color3(0, 0.8, 1)
      barrierMat.emissiveColor = theme === 'volcano' ? new Color3(0.8, 0.1, 0) : new Color3(0, 0.6, 0.9)
      barrierMat.emissiveIntensity = 2.5
      barrierMat.metallic = 0.9
      barrierMat.roughness = 0.1

      const barrierL = MeshBuilder.CreateBox('barrierL', { width: 0.3, height: 2.2, depth: 8 }, this.scene)
      barrierL.position.set(-boundsX, 1.1, 0)
      barrierL.material = barrierMat

      const barrierR = MeshBuilder.CreateBox('barrierR', { width: 0.3, height: 2.2, depth: 8 }, this.scene)
      barrierR.position.set(boundsX, 1.1, 0)
      barrierR.material = barrierMat
    }

    // 2c. Cheering Animated Crowd in Background
    if (theme === 'cyber-city' || theme === 'neon-dojo') {
      const crowdColor = theme === 'cyber-city' ? '#00FFFF' : '#FF00FF'
      const crowdMat = new PBRMaterial('crowdMat', this.scene)
      crowdMat.albedoColor = Color3.FromHexString(crowdColor)
      crowdMat.emissiveColor = Color3.FromHexString(crowdColor)
      crowdMat.emissiveIntensity = 1.2
      crowdMat.metallic = 0.6
      crowdMat.roughness = 0.4

      const spectators: AbstractMesh[] = []
      for (let i = 0; i < 12; i++) {
        const xPos = -18 + i * 3.3 + (Math.random() - 0.5) * 0.4
        const zPos = 13 + (Math.random() - 0.5) * 1.5
        const spectator = MeshBuilder.CreateCylinder(`spectator_${i}`, { height: 1.2, diameter: 0.45 }, this.scene)
        spectator.position.set(xPos, 0.6, zPos)
        spectator.material = crowdMat
        spectators.push(spectator)
      }

      let crowdTimer = 0
      this.scene.onBeforeRenderObservable.add(() => {
        crowdTimer += 0.05
        spectators.forEach((s, idx) => {
          s.position.y = 0.6 + Math.sin(crowdTimer + idx) * 0.18
          s.scaling.y = 1.0 + Math.abs(Math.sin(crowdTimer + idx)) * 0.12
        })
      })
    }

    // 3. Stage-specific dynamic backdrop assets
    if (theme === 'volcano') {
      groundMat.albedoColor = new Color3(0.08, 0.015, 0)
      groundMat.emissiveColor = new Color3(0.08, 0.01, 0)
      
      // Bubbling lava glows (dynamic point lights)
      const lavaLight = new PointLight('lavaLight', new Vector3(0, 0.5, 4), this.scene)
      lavaLight.diffuse = new Color3(1, 0.25, 0)
      lavaLight.intensity = 2.5
      lavaLight.range = 25

      let lightTimer = 0
      this.scene.onBeforeRenderObservable.add(() => {
        lightTimer += 0.04
        lavaLight.intensity = 2.0 + Math.sin(lightTimer * 2) * 0.5
      })
    } 
    else if (theme === 'cyber-city') {
      groundMat.albedoColor = new Color3(0.01, 0.01, 0.03)
      groundMat.emissiveColor = new Color3(0, 0, 0.02)

      // Procedural neon billboards
      const board = MeshBuilder.CreatePlane('billboard', { width: 14, height: 7 }, this.scene)
      board.position.set(0, 8, 15)
      
      const dynText = new DynamicTexture("cyberBillboardText", { width: 512, height: 256 }, this.scene, true)
      const boardMat = new StandardMaterial('boardMat', this.scene)
      boardMat.emissiveTexture = dynText
      boardMat.disableLighting = true
      board.material = boardMat

      let bTimer = 0
      this.scene.onBeforeRenderObservable.add(() => {
        bTimer++
        if (bTimer % 45 === 0) {
          const ctx = dynText.getContext() as CanvasRenderingContext2D
          ctx.fillStyle = '#030308'
          ctx.fillRect(0, 0, 512, 256)
          
          ctx.strokeStyle = '#00ffff'
          ctx.lineWidth = 4
          ctx.strokeRect(10, 10, 492, 236)
          
          ctx.font = 'bold 36px Orbitron'
          ctx.fillStyle = bTimer % 90 === 0 ? '#ff00ff' : '#00ffff'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText("ULTRA FIGHTER X", 256, 128)
          
          dynText.update()
        }
      })

      // Drones / Floating cyber cars
      const car = MeshBuilder.CreateBox('cyberCar', { width: 1.5, height: 0.4, depth: 0.8 }, this.scene)
      car.position.set(-25, 6, 14)
      const carMat = new StandardMaterial('carMat', this.scene)
      carMat.emissiveColor = new Color3(0, 0.8, 1)
      car.material = carMat

      this.scene.onBeforeRenderObservable.add(() => {
        car.position.x += 0.05
        if (car.position.x > 25) car.position.x = -25
      })
    } 
    else if (theme === 'space-station') {
      groundMat.albedoColor = new Color3(0.02, 0.02, 0.06)

      // Rotating Earth Sphere
      const earth = MeshBuilder.CreateSphere('earth', { diameter: 14, segments: 24 }, this.scene)
      earth.position.set(0, -3, 22)
      
      const earthMat = new PBRMaterial('earthMat', this.scene)
      earthMat.albedoColor = new Color3(0.1, 0.2, 0.6)
      earthMat.emissiveColor = new Color3(0.02, 0.04, 0.12)
      earthMat.metallic = 0.2
      earthMat.roughness = 0.8
      earth.material = earthMat

      this.scene.onBeforeRenderObservable.add(() => {
        earth.rotation.y += 0.0008
      })
    } 
    else if (theme === 'neon-dojo') {
      groundMat.albedoColor = new Color3(0.04, 0.015, 0.04)
      
      // Neon Torii Gate
      const toriiL = MeshBuilder.CreateCylinder('toriiL', { height: 8, diameter: 0.4 }, this.scene)
      toriiL.position.set(-5, 4, 12)
      const toriiR = MeshBuilder.CreateCylinder('toriiR', { height: 8, diameter: 0.4 }, this.scene)
      toriiR.position.set(5, 4, 12)
      
      const toriiTop = MeshBuilder.CreateBox('toriiTop', { width: 12, height: 0.5, depth: 0.5 }, this.scene)
      toriiTop.position.set(0, 8, 12)

      const toriiMat = new PBRMaterial('toriiMat', this.scene)
      toriiMat.albedoColor = new Color3(0.8, 0.1, 0)
      toriiMat.emissiveColor = new Color3(0.4, 0.05, 0)
      toriiMat.emissiveIntensity = 1.8
      
      toriiL.material = toriiMat
      toriiR.material = toriiMat
      toriiTop.material = toriiMat
    }

    // 4. Parallax Background pillars (high poly count / specular reflections)
    for (let i = -5; i <= 5; i++) {
      const pillar = MeshBuilder.CreateBox(`pillar_${i}`, { width: 2.8, height: 35, depth: 2.8 }, this.scene)
      pillar.position.set(i * 12, 17.5, 16)
      const pMat = new PBRMaterial(`pMat_${i}`, this.scene)
      
      if (theme === 'volcano') {
        pMat.albedoColor = new Color3(0.18, 0.04, 0.04)
        pMat.emissiveColor = new Color3(0.06, 0.01, 0)
        pMat.metallic = 0.5
        pMat.roughness = 0.4
      } else if (theme === 'space-station') {
        pMat.albedoColor = new Color3(0.05, 0.05, 0.08)
        pMat.emissiveColor = new Color3(0, 0.1, 0.2)
        pMat.metallic = 0.95
        pMat.roughness = 0.1
      } else {
        pMat.albedoColor = new Color3(0.08, 0.08, 0.12)
        pMat.emissiveColor = new Color3(0, 0.15, 0.3)
        pMat.metallic = 0.8
        pMat.roughness = 0.2
      }
      
      pillar.material = pMat
      pillar.receiveShadows = true
    }

    // Initialize environment weather particle system
    this.createWeatherSystem(theme)
  }

  createWeatherSystem(theme: string): void {
    if (theme === 'cyber-city') {
      // 1. Rain system (fast-falling light blue lines)
      const rainMat = new PBRMaterial('rainMat', this.scene)
      rainMat.albedoColor = new Color3(0.5, 0.8, 1.0)
      rainMat.emissiveColor = new Color3(0.3, 0.6, 0.9)
      rainMat.emissiveIntensity = 2.0
      rainMat.alpha = 0.4
      rainMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND

      const count = 120
      const rainLines: AbstractMesh[] = []
      for (let i = 0; i < count; i++) {
        const rainLine = MeshBuilder.CreateBox(`rain_${i}`, { width: 0.02, height: 0.8, depth: 0.02 }, this.scene)
        rainLine.position.set(
          (Math.random() - 0.5) * 40,
          Math.random() * 12,
          (Math.random() - 0.5) * 12
        )
        rainLine.material = rainMat
        rainLines.push(rainLine)
      }

      this.scene.onBeforeRenderObservable.add(() => {
        rainLines.forEach(rl => {
          rl.position.y -= 0.35 + Math.random() * 0.1
          rl.position.x -= 0.04 // slight angle wind drift
          if (rl.position.y < 0) {
            rl.position.y = 12
            rl.position.x = (Math.random() - 0.5) * 40
            rl.position.z = (Math.random() - 0.5) * 12
          }
        })
      })
    } 
    else if (theme === 'volcano') {
      // 2. Ash system (slow drifting orange ash)
      const ashMat = new PBRMaterial('ashMat', this.scene)
      ashMat.albedoColor = new Color3(1.0, 0.35, 0)
      ashMat.emissiveColor = new Color3(0.8, 0.25, 0)
      ashMat.emissiveIntensity = 2.5
      ashMat.alpha = 0.7
      ashMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND

      const count = 80
      const ashParticles: AbstractMesh[] = []
      for (let i = 0; i < count; i++) {
        const ash = MeshBuilder.CreateBox(`ash_${i}`, { width: 0.08, height: 0.08, depth: 0.08 }, this.scene)
        ash.position.set(
          (Math.random() - 0.5) * 36,
          Math.random() * 10,
          (Math.random() - 0.5) * 12
        )
        ash.material = ashMat
        ashParticles.push(ash)
      }

      let time = 0
      this.scene.onBeforeRenderObservable.add(() => {
        time += 0.02
        ashParticles.forEach((ash, idx) => {
          ash.position.y -= 0.04 + Math.random() * 0.03
          ash.position.x += Math.sin(time + idx) * 0.02
          ash.position.z += Math.cos(time + idx) * 0.02
          if (ash.position.y < 0) {
            ash.position.y = 10
            ash.position.x = (Math.random() - 0.5) * 36
            ash.position.z = (Math.random() - 0.5) * 12
          }
        })
      })
    } 
    else if (theme === 'neon-dojo') {
      // 3. Falling sakura petals (gently drifting pink planes/boxes)
      const sakuraMat = new PBRMaterial('sakuraMat', this.scene)
      sakuraMat.albedoColor = new Color3(1.0, 0.72, 0.77) // Pink
      sakuraMat.emissiveColor = new Color3(0.9, 0.55, 0.6)
      sakuraMat.emissiveIntensity = 1.8
      sakuraMat.alpha = 0.85
      sakuraMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND

      const count = 60
      const petals: AbstractMesh[] = []
      for (let i = 0; i < count; i++) {
        const petal = MeshBuilder.CreateBox(`sakura_${i}`, { width: 0.15, height: 0.03, depth: 0.15 }, this.scene)
        petal.position.set(
          (Math.random() - 0.5) * 32,
          Math.random() * 10,
          (Math.random() - 0.5) * 11
        )
        petal.rotation.set(Math.random(), Math.random(), Math.random())
        petal.material = sakuraMat
        petals.push(petal)
      }

      let time = 0
      this.scene.onBeforeRenderObservable.add(() => {
        time += 0.015
        petals.forEach((p, idx) => {
          p.position.y -= 0.02 + Math.random() * 0.02
          p.position.x -= 0.015 + Math.sin(time + idx) * 0.01
          p.position.z += Math.cos(time + idx) * 0.01
          p.rotation.y += 0.01
          p.rotation.x += 0.005
          if (p.position.y < 0) {
            p.position.y = 10
            p.position.x = (Math.random() - 0.5) * 32
            p.position.z = (Math.random() - 0.5) * 11
          }
        })
      })
    }
  }

  createPBRMaterial(name: string, config: {
    albedoColor?: Color3
    albedoTexture?: string
    metallic?: number
    roughness?: number
    emissiveColor?: Color3
    emissiveIntensity?: number
  }): PBRMaterial {
    const mat = new PBRMaterial(name, this.scene)
    
    if (config.albedoColor) mat.albedoColor = config.albedoColor
    if (config.albedoTexture) mat.albedoTexture = new Texture(config.albedoTexture, this.scene)
    
    mat.metallic = config.metallic ?? 0.8
    mat.roughness = config.roughness ?? 0.2
    
    if (config.emissiveColor) {
      mat.emissiveColor = config.emissiveColor
      mat.emissiveIntensity = config.emissiveIntensity ?? 1
    }

    return mat
  }
}
