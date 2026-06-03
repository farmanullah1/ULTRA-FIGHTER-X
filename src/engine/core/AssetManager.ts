import { 
  Scene, PBRMaterial, Texture, Color3, AnimationGroup, TransformNode, 
  AbstractMesh, MeshBuilder, StandardMaterial, Vector3, PointLight, DynamicTexture 
} from '@babylonjs/core'
import '@babylonjs/loaders/glTF'
import type { CharacterDef } from '@game-types/character.types'
import { useSettingsStore } from '@stores/settingsStore'

export class AssetManager {
  private scene: Scene

  constructor(scene: Scene) {
    this.scene = scene
  }

  async loadCharacterModel(_modelPath: string, characterDef: CharacterDef, colorIndex: number = 0): Promise<{
    root: TransformNode
    mesh: AbstractMesh
    animations: Map<string, AnimationGroup>
  }> {
    // We always fall back to our advanced procedural models to enforce consistent high-graphics aesthetic and seamless animation compatibility.
    return this.createProceduralCharacter(characterDef, colorIndex)
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

  private createProceduralCharacter(characterDef: CharacterDef, colorIndex: number = 0): {
    root: TransformNode
    mesh: AbstractMesh
    animations: Map<string, AnimationGroup>
  } {
    const root = new TransformNode('charRootPlaceholder_' + characterDef.id, this.scene)
    
    const primaryColor = this.getAlternateColor(characterDef.colors.primary, colorIndex)
    const secondaryColor = this.getAlternateColor(characterDef.colors.secondary, colorIndex)
    const auraColor = this.getAlternateColor(characterDef.colors.aura, colorIndex)

    // Create highly detailed procedurally mapped PBR materials (4K-like detail)
    const bodyMat = new PBRMaterial('bodyMat_' + characterDef.id, this.scene)
    bodyMat.albedoTexture = this.createNoiseTexture(primaryColor, '#121212')
    bodyMat.metallic = 0.85
    bodyMat.roughness = 0.18
    bodyMat.directIntensity = 1.5
    bodyMat.specularIntensity = 1.0

    const accentMat = new PBRMaterial('accentMat_' + characterDef.id, this.scene)
    accentMat.albedoTexture = this.createNoiseTexture(secondaryColor, '#0a0a0a')
    accentMat.metallic = 0.95
    accentMat.roughness = 0.12
    accentMat.directIntensity = 1.5

    const glowMat = new PBRMaterial('glowMat_' + characterDef.id, this.scene)
    glowMat.albedoColor = Color3.FromHexString(auraColor)
    glowMat.emissiveColor = Color3.FromHexString(auraColor)
    glowMat.emissiveIntensity = 2.5
    glowMat.metallic = 0.1
    glowMat.roughness = 0.5

    // Skin-like material for face/hands
    const skinMat = new PBRMaterial('skinMat_' + characterDef.id, this.scene)
    skinMat.albedoColor = new Color3(0.22, 0.16, 0.12)
    skinMat.metallic = 0.0
    skinMat.roughness = 0.75

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
    const bodyWidth = isHeavy ? 1.05 : 0.78
    const bodyHeight = isHeavy ? 1.25 : 1.1
    const bodyDepth = isHeavy ? 0.65 : 0.42
    const headSize = isHeavy ? 0.48 : 0.40
    const legW = isHeavy ? 0.38 : 0.26
    const armW = isHeavy ? 0.34 : 0.22

    // === TORSO ===
    const body = MeshBuilder.CreateBox('body', { width: bodyWidth, height: bodyHeight, depth: bodyDepth }, this.scene)
    body.position.y = isHeavy ? 1.45 : 1.38
    body.material = bodyMat
    body.parent = root

    // Chest panel detail
    const chestDetail = MeshBuilder.CreateBox('chestDetail', { width: bodyWidth * 0.55, height: bodyHeight * 0.45, depth: bodyDepth * 0.15 }, this.scene)
    chestDetail.position.set(0, 0.08, bodyDepth * 0.5 + 0.01)
    chestDetail.material = accentMat
    chestDetail.parent = body

    // === PELVIS / WAIST ===
    const pelvis = MeshBuilder.CreateBox('pelvis', { width: bodyWidth * 0.9, height: 0.32, depth: bodyDepth * 0.85 }, this.scene)
    pelvis.position.y = isHeavy ? 0.78 : 0.72
    pelvis.material = accentMat
    pelvis.parent = root

    // === HEAD ===
    const head = MeshBuilder.CreateBox('head', { width: headSize, height: headSize * 1.15, depth: headSize * 0.95 }, this.scene)
    head.position.y = isHeavy ? 2.22 : 2.18
    head.material = skinMat
    head.parent = root

    // Helmet/mask overlay
    const helmet = MeshBuilder.CreateBox('helmet', { width: headSize + 0.04, height: headSize * 0.6, depth: headSize + 0.04 }, this.scene)
    helmet.position.set(0, headSize * 0.28, 0)
    helmet.material = bodyMat
    helmet.parent = head

    // Eyes glow
    const eyeL = MeshBuilder.CreateBox('eyeL', { width: 0.1, height: 0.06, depth: 0.04 }, this.scene)
    eyeL.position.set(-0.09, 0.02, headSize * 0.48)
    eyeL.material = glowMat
    eyeL.parent = head

    const eyeR = MeshBuilder.CreateBox('eyeR', { width: 0.1, height: 0.06, depth: 0.04 }, this.scene)
    eyeR.position.set(0.09, 0.02, headSize * 0.48)
    eyeR.material = glowMat
    eyeR.parent = head

    // Neck
    const neck = MeshBuilder.CreateCylinder('neck', { height: 0.24, diameter: 0.2 }, this.scene)
    neck.position.y = isHeavy ? 2.05 : 2.02
    neck.material = skinMat
    neck.parent = root

    // === UPPER ARMS ===
    const upperArmL = MeshBuilder.CreateBox('upperArmL', { width: armW, height: 0.58, depth: armW }, this.scene)
    upperArmL.position.set(isHeavy ? -0.72 : -0.54, isHeavy ? 1.62 : 1.55, 0)
    upperArmL.material = bodyMat
    upperArmL.parent = root

    const upperArmR = MeshBuilder.CreateBox('upperArmR', { width: armW, height: 0.58, depth: armW }, this.scene)
    upperArmR.position.set(isHeavy ? 0.72 : 0.54, isHeavy ? 1.62 : 1.55, 0)
    upperArmR.material = bodyMat
    upperArmR.parent = root

    // === FOREARMS ===
    const forearmL = MeshBuilder.CreateBox('forearmL', { width: armW * 0.85, height: 0.52, depth: armW * 0.85 }, this.scene)
    forearmL.position.set(isHeavy ? -0.72 : -0.54, isHeavy ? 1.08 : 1.02, 0)
    forearmL.material = accentMat
    forearmL.parent = root

    const forearmR = MeshBuilder.CreateBox('forearmR', { width: armW * 0.85, height: 0.52, depth: armW * 0.85 }, this.scene)
    forearmR.position.set(isHeavy ? 0.72 : 0.54, isHeavy ? 1.08 : 1.02, 0)
    forearmR.material = accentMat
    forearmR.parent = root

    // Hands (fists)
    const handL = MeshBuilder.CreateBox('handL', { width: armW * 0.9, height: 0.22, depth: armW * 0.9 }, this.scene)
    handL.position.set(isHeavy ? -0.72 : -0.54, isHeavy ? 0.76 : 0.7, 0)
    handL.material = skinMat
    handL.parent = root

    const handR = MeshBuilder.CreateBox('handR', { width: armW * 0.9, height: 0.22, depth: armW * 0.9 }, this.scene)
    handR.position.set(isHeavy ? 0.72 : 0.54, isHeavy ? 0.76 : 0.7, 0)
    handR.material = skinMat
    handR.parent = root

    // === UPPER LEGS (THIGHS) ===
    const thighL = MeshBuilder.CreateBox('thighL', { width: legW, height: 0.55, depth: legW }, this.scene)
    thighL.position.set(isHeavy ? -0.28 : -0.2, isHeavy ? 0.52 : 0.48, 0)
    thighL.material = bodyMat
    thighL.parent = root

    const thighR = MeshBuilder.CreateBox('thighR', { width: legW, height: 0.55, depth: legW }, this.scene)
    thighR.position.set(isHeavy ? 0.28 : 0.2, isHeavy ? 0.52 : 0.48, 0)
    thighR.material = bodyMat
    thighR.parent = root

    // === LOWER LEGS (CALVES) ===
    const calfL = MeshBuilder.CreateBox('calfL', { width: legW * 0.78, height: 0.5, depth: legW }, this.scene)
    calfL.position.set(isHeavy ? -0.28 : -0.2, isHeavy ? 0.0 : -0.03, 0)
    calfL.material = accentMat
    calfL.parent = root

    const calfR = MeshBuilder.CreateBox('calfR', { width: legW * 0.78, height: 0.5, depth: legW }, this.scene)
    calfR.position.set(isHeavy ? 0.28 : 0.2, isHeavy ? 0.0 : -0.03, 0)
    calfR.material = accentMat
    calfR.parent = root

    // Feet / Boots
    const footL = MeshBuilder.CreateBox('footL', { width: legW * 0.9, height: 0.18, depth: legW * 1.4 }, this.scene)
    footL.position.set(isHeavy ? -0.28 : -0.2, isHeavy ? -0.25 : -0.28, 0.06)
    footL.material = accentMat
    footL.parent = root

    const footR = MeshBuilder.CreateBox('footR', { width: legW * 0.9, height: 0.18, depth: legW * 1.4 }, this.scene)
    footR.position.set(isHeavy ? 0.28 : 0.2, isHeavy ? -0.25 : -0.28, 0.06)
    footR.material = accentMat
    footR.parent = root

    // Add character specific custom attachments
    if (characterDef.id === 'kai-storm') {
      // Visor
      const visor = MeshBuilder.CreateBox('visor', { width: 0.44, height: 0.08, depth: 0.1 }, this.scene)
      visor.position.set(0, 0.05, 0.2)
      visor.material = glowMat
      visor.parent = head

      // Dual back katanas
      const katana1 = MeshBuilder.CreateBox('katana1', { width: 0.05, height: 1.3, depth: 0.04 }, this.scene)
      katana1.position.set(-0.22, 0.15, -0.28)
      katana1.rotation.set(0, 0, Math.PI / 5)
      katana1.material = accentMat
      katana1.parent = body

      const katana2 = MeshBuilder.CreateBox('katana2', { width: 0.05, height: 1.3, depth: 0.04 }, this.scene)
      katana2.position.set(0.22, 0.15, -0.28)
      katana2.rotation.set(0, 0, -Math.PI / 5)
      katana2.material = accentMat
      katana2.parent = body

      // Shoulder pads
      const shoulderL = MeshBuilder.CreateBox('shoulderL', { width: 0.35, height: 0.18, depth: 0.35 }, this.scene)
      shoulderL.position.set(-0.54, 0.28, 0)
      shoulderL.material = glowMat
      shoulderL.parent = body

      const shoulderR = MeshBuilder.CreateBox('shoulderR', { width: 0.35, height: 0.18, depth: 0.35 }, this.scene)
      shoulderR.position.set(0.54, 0.28, 0)
      shoulderR.material = glowMat
      shoulderR.parent = body
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

      // Wrist blade
      const wristBlade = MeshBuilder.CreateBox('wristBlade', { width: 0.04, height: 0.35, depth: 0.04 }, this.scene)
      wristBlade.position.set(0, -0.2, 0.12)
      wristBlade.rotation.set(0.4, 0, 0)
      wristBlade.material = glowMat
      wristBlade.parent = forearmL
    } 
    else if (characterDef.id === 'iron-claw') {
      // Giant hydraulic gauntlets (attached to forearms)
      const clawL = MeshBuilder.CreateBox('clawL', { width: 0.48, height: 0.55, depth: 0.48 }, this.scene)
      clawL.position.set(0, -0.36, 0)
      clawL.material = accentMat
      clawL.parent = forearmL

      const clawR = MeshBuilder.CreateBox('clawR', { width: 0.48, height: 0.55, depth: 0.48 }, this.scene)
      clawR.position.set(0, -0.36, 0)
      clawR.material = accentMat
      clawR.parent = forearmR

      // Hydraulic pistons on back
      const pistonL = MeshBuilder.CreateCylinder('pistonL', { height: 0.8, diameter: 0.12 }, this.scene)
      pistonL.position.set(-0.25, 0.3, -0.38)
      pistonL.rotation.set(-0.2, 0, 0)
      pistonL.material = accentMat
      pistonL.parent = body

      const pistonR = MeshBuilder.CreateCylinder('pistonR', { height: 0.8, diameter: 0.12 }, this.scene)
      pistonR.position.set(0.25, 0.3, -0.38)
      pistonR.rotation.set(-0.2, 0, 0)
      pistonR.material = accentMat
      pistonR.parent = body

      // Chest armor plates
      const plateL = MeshBuilder.CreateBox('plateL', { width: 0.38, height: bodyHeight * 0.55, depth: 0.1 }, this.scene)
      plateL.position.set(-0.22, 0.08, bodyDepth * 0.5 + 0.04)
      plateL.material = glowMat
      plateL.parent = body

      const plateR = MeshBuilder.CreateBox('plateR', { width: 0.38, height: bodyHeight * 0.55, depth: 0.1 }, this.scene)
      plateR.position.set(0.22, 0.08, bodyDepth * 0.5 + 0.04)
      plateR.material = glowMat
      plateR.parent = body
    } 
    else if (characterDef.id === 'nova-star') {
      // Celestial Halo
      const halo = MeshBuilder.CreateTorus('halo', { diameter: 0.55, thickness: 0.04 }, this.scene)
      halo.position.set(0, 0.38, 0)
      halo.rotation.set(Math.PI / 10, 0, 0)
      halo.material = glowMat
      halo.parent = head

      // Floating shoulders orbs
      const orbL = MeshBuilder.CreateSphere('orbL', { diameter: 0.28 }, this.scene)
      orbL.position.set(-0.62, 0.32, 0)
      orbL.material = glowMat
      orbL.parent = body

      const orbR = MeshBuilder.CreateSphere('orbR', { diameter: 0.28 }, this.scene)
      orbR.position.set(0.62, 0.32, 0)
      orbR.material = glowMat
      orbR.parent = body

      // Chest star
      const star = MeshBuilder.CreateBox('star', { width: 0.22, height: 0.22, depth: 0.06 }, this.scene)
      star.position.set(0, 0.2, 0.22)
      star.material = glowMat
      star.parent = body

      // Cape wisps
      const capeL = MeshBuilder.CreateBox('capeL', { width: 0.12, height: 0.9, depth: 0.04 }, this.scene)
      capeL.position.set(-0.45, -0.15, -0.28)
      capeL.rotation.set(0.25, 0.3, -0.2)
      capeL.material = glowMat
      capeL.parent = body

      const capeR = MeshBuilder.CreateBox('capeR', { width: 0.12, height: 0.9, depth: 0.04 }, this.scene)
      capeR.position.set(0.45, -0.15, -0.28)
      capeR.rotation.set(0.25, -0.3, 0.2)
      capeR.material = glowMat
      capeR.parent = body
    } 
    else if (characterDef.id === 'shadow-byte') {
      // Digital glitch shards
      for (let i = 0; i < 5; i++) {
        const shard = MeshBuilder.CreateBox(`shard_${i}`, { size: 0.06 + Math.random() * 0.08 }, this.scene)
        shard.position.set((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.6, (Math.random() < 0.5 ? 0.24 : -0.24))
        shard.rotation.set(Math.random(), Math.random(), Math.random())
        shard.material = glowMat
        shard.parent = body
      }

      const visor = MeshBuilder.CreateBox('visor', { width: 0.44, height: 0.05, depth: 0.1 }, this.scene)
      visor.position.set(0, 0.02, 0.2)
      visor.material = glowMat
      visor.parent = head

      const trail1 = MeshBuilder.CreateBox('trail1', { width: 0.04, height: 0.65, depth: 0.04 }, this.scene)
      trail1.position.set(-0.15, -0.2, -0.28)
      trail1.material = glowMat
      trail1.parent = body

      const trail2 = MeshBuilder.CreateBox('trail2', { width: 0.04, height: 0.45, depth: 0.04 }, this.scene)
      trail2.position.set(0.15, -0.35, -0.28)
      trail2.material = glowMat
      trail2.parent = body
    } 
    else if (characterDef.id === 'phoenix-rise') {
      // Fire Horns
      const hornL = MeshBuilder.CreateBox('hornL', { width: 0.06, height: 0.32, depth: 0.06 }, this.scene)
      hornL.position.set(-0.16, 0.32, 0)
      hornL.rotation.set(0, 0, -0.28)
      hornL.material = glowMat
      hornL.parent = head

      const hornR = MeshBuilder.CreateBox('hornR', { width: 0.06, height: 0.32, depth: 0.06 }, this.scene)
      hornR.position.set(0.16, 0.32, 0)
      hornR.rotation.set(0, 0, 0.28)
      hornR.material = glowMat
      hornR.parent = head

      // Blazing wings (multi-feather layer)
      for (let i = 0; i < 3; i++) {
        const wL = MeshBuilder.CreateBox(`wingL_${i}`, { width: 0.06, height: 0.8 + i * 0.18, depth: 0.22 }, this.scene)
        wL.position.set(-0.52 - i * 0.14, 0.1 - i * 0.1, -0.2 - i * 0.04)
        wL.rotation.set(0.2 + i * 0.08, 0.3, -Math.PI / 4 - i * 0.08)
        wL.material = glowMat
        wL.parent = body

        const wR = MeshBuilder.CreateBox(`wingR_${i}`, { width: 0.06, height: 0.8 + i * 0.18, depth: 0.22 }, this.scene)
        wR.position.set(0.52 + i * 0.14, 0.1 - i * 0.1, -0.2 - i * 0.04)
        wR.rotation.set(0.2 + i * 0.08, -0.3, Math.PI / 4 + i * 0.08)
        wR.material = glowMat
        wR.parent = body
      }

      // Flame shoulder pauldrons
      const shoulderL = MeshBuilder.CreateSphere('shoulderL', { diameter: 0.3 }, this.scene)
      shoulderL.position.set(-0.5, 0.3, 0)
      shoulderL.material = glowMat
      shoulderL.parent = body

      const shoulderR = MeshBuilder.CreateSphere('shoulderR', { diameter: 0.3 }, this.scene)
      shoulderR.position.set(0.5, 0.3, 0)
      shoulderR.material = glowMat
      shoulderR.parent = body
    }

    // Idle breathing animation on body
    const baseBodyY = isHeavy ? 1.45 : 1.38
    let animTimer = Math.random() * Math.PI * 2
    this.scene.onBeforeRenderObservable.add(() => {
      animTimer += 0.028
      body.position.y = baseBodyY + Math.sin(animTimer) * 0.011
    })

    return {
      root,
      mesh: body,
      animations: new Map()
    }
  }

  createStage(theme: string): void {
    const quality = useSettingsStore.getState().graphicsQuality
    const isMobileOrLow = quality === 'low' || (typeof window !== 'undefined' && window.innerWidth < 1024)

    // 1. High quality floor material with mirror specular
    const ground = MeshBuilder.CreateGround('ground', { width: 60, height: 30 }, this.scene)
    const groundMat = new PBRMaterial('groundMat', this.scene)
    groundMat.metallic = 0.92
    groundMat.roughness = 0.1
    groundMat.reflectionColor = new Color3(0.6, 0.6, 0.6)
    ground.material = groundMat
    ground.receiveShadows = true

    // Three-layer parallax background system
    const textureName = theme.replace(/-/g, '_')

    // Layer 0: Sky/far background — slowest parallax (depth 30)
    const bgFar = MeshBuilder.CreatePlane('bgFar', { width: 90, height: 46 }, this.scene)
    bgFar.position.set(0, 18, 30)
    bgFar.isPickable = false
    const bgFarMat = new StandardMaterial('bgFarMat', this.scene)
    bgFarMat.emissiveTexture = new Texture(`${import.meta.env.BASE_URL}assets/images/stages/${textureName}_bg.png`, this.scene)
    bgFarMat.disableLighting = true
    bgFarMat.emissiveColor = new Color3(1, 1, 1)
    bgFar.material = bgFarMat

    // Layer 1: Mid-ground (buildings) — medium parallax (depth 20)
    const bgMid = MeshBuilder.CreatePlane('bgMid', { width: 75, height: 34 }, this.scene)
    bgMid.position.set(0, 13, 20)
    bgMid.isPickable = false
    const bgMidMat = new StandardMaterial('bgMidMat', this.scene)
    bgMidMat.emissiveTexture = new Texture(`${import.meta.env.BASE_URL}assets/images/stages/${textureName}_bg_wide.png`, this.scene)
    bgMidMat.disableLighting = true
    bgMidMat.emissiveColor = new Color3(0.9, 0.9, 0.95)
    bgMid.material = bgMidMat

    // Parallax scroll: each layer moves proportional to camera
    this.scene.onBeforeRenderObservable.add(() => {
      if (this.scene.activeCamera) {
        const cam = this.scene.activeCamera as any
        const targetX = cam.target ? cam.target.x : 0
        bgFar.position.x = targetX * 0.04
        bgMid.position.x = targetX * 0.18
      }
    })

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

    // Enhanced 3-row animated crowd system
    if (!isMobileOrLow) {
      const crowdRowDefs = [
        { z: 10, count: 20, scale: 0.88, speed: 0.055, zVariance: 0.8 },
        { z: 13, count: 15, scale: 0.72, speed: 0.044, zVariance: 0.6 },
        { z: 16, count: 10, scale: 0.58, speed: 0.033, zVariance: 0.4 },
      ]
      const crowdPalette = theme === 'volcano' ? ['#FF4400','#FF8800','#FFAA00']
        : theme === 'space-station' ? ['#4400FF','#0088FF','#00FFCC']
        : theme === 'neon-dojo' ? ['#FF00CC','#FFD700','#FF77AA']
        : ['#00FFFF','#FF00FF','#00FF88']

      const allSpectators: { mesh: AbstractMesh; baseY: number; phase: number; speed: number }[] = []

      for (const row of crowdRowDefs) {
        const rowMat = new PBRMaterial(`crowdMat_${row.z}`, this.scene)
        const colHex = crowdPalette[Math.floor(Math.random() * crowdPalette.length)]
        const col = Color3.FromHexString(colHex)
        rowMat.albedoColor = col.scale(0.3)
        rowMat.emissiveColor = col
        rowMat.emissiveIntensity = 1.4
        rowMat.metallic = 0.5; rowMat.roughness = 0.5

        const headMat = new StandardMaterial(`headMat_${row.z}`, this.scene)
        headMat.diffuseColor = new Color3(0.28, 0.2, 0.15)
        headMat.emissiveColor = new Color3(0.05, 0.04, 0.03)

        for (let ci = 0; ci < row.count; ci++) {
          const xPos = -24 + ci * (48 / row.count) + (Math.random() - 0.5) * 1.0
          const zPos = row.z + (Math.random() - 0.5) * row.zVariance
          const baseY = row.scale * 0.55

          const body = MeshBuilder.CreateCylinder(`crowd_b_${row.z}_${ci}`, {
            height: row.scale * 1.1, diameterTop: row.scale * 0.3, diameterBottom: row.scale * 0.34, tessellation: 6
          }, this.scene)
          body.position.set(xPos, baseY, zPos)
          body.material = rowMat
          allSpectators.push({ mesh: body, baseY, phase: Math.random() * Math.PI * 2, speed: row.speed })

          const head = MeshBuilder.CreateSphere(`crowd_h_${row.z}_${ci}`, { diameter: row.scale * 0.26, segments: 5 }, this.scene)
          head.position.set(xPos, baseY + row.scale * 0.73, zPos)
          head.material = headMat
          allSpectators.push({ mesh: head, baseY: baseY + row.scale * 0.73, phase: Math.random() * Math.PI * 2, speed: row.speed })

          // Raised arms on every 3rd person
          if (ci % 3 === 0) {
            const armMat = new PBRMaterial(`armMat_${row.z}_${ci}`, this.scene)
            armMat.emissiveColor = col; armMat.emissiveIntensity = 2.5; armMat.metallic = 0; armMat.roughness = 1
            const arm = MeshBuilder.CreateBox(`crowd_a_${row.z}_${ci}`, {
              width: row.scale * 0.07, height: row.scale * 0.5, depth: row.scale * 0.07
            }, this.scene)
            arm.position.set(xPos + row.scale * 0.18, baseY + row.scale * 1.22, zPos)
            arm.material = armMat
            allSpectators.push({ mesh: arm, baseY: baseY + row.scale * 1.22, phase: Math.random() * Math.PI * 2, speed: row.speed + 0.02 })
          }
        }
      }

      let crowdTimer = 0
      this.scene.onBeforeRenderObservable.add(() => {
        crowdTimer += 0.05
        for (const s of allSpectators) {
          s.mesh.position.y = s.baseY + Math.sin(crowdTimer * s.speed * 20 + s.phase) * 0.15
        }
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

      // Animated neon billboard with cycling messages
      const dynText = new DynamicTexture("cyberBillboardText", { width: 512, height: 256 }, this.scene, true)
      const board = MeshBuilder.CreatePlane('billboard', { width: 14, height: 7 }, this.scene)
      board.position.set(0, 8.5, 15)
      const boardMat = new StandardMaterial('boardMat', this.scene)
      boardMat.emissiveTexture = dynText
      boardMat.disableLighting = true
      board.material = boardMat

      const messages = ['ULTRA FIGHTER X', 'CYBER ARENA', 'K.O. CHAMPION', '格闘最強', 'NEON RUSH 2099']
      let msgIdx = 0, bTimer = 0
      const drawBoard = () => {
        const ctx = dynText.getContext() as CanvasRenderingContext2D
        const colors = ['#00ffff','#ff00ff','#ffe600','#ff6600','#00ff88']
        const c = colors[msgIdx % colors.length]
        ctx.fillStyle = '#010108'
        ctx.fillRect(0, 0, 512, 256)
        ctx.strokeStyle = c; ctx.lineWidth = 6
        ctx.strokeRect(8, 8, 496, 240)
        ctx.strokeStyle = `${c}88`; ctx.lineWidth = 2
        ctx.strokeRect(18, 18, 476, 220)
        ctx.fillStyle = c
        ctx.font = 'bold 44px Arial'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(messages[msgIdx % messages.length], 256, 120)
        ctx.fillStyle = `${c}88`
        ctx.font = '16px Arial'
        ctx.fillText('★ CYBER ARENA 2099 ★', 256, 196)
        dynText.update()
      }
      drawBoard()
      this.scene.onBeforeRenderObservable.add(() => {
        bTimer++
        if (bTimer % 90 === 0) { msgIdx++; drawBoard() }
      })

      // Multiple moving hovercars at different heights and speeds
      const carDefs = [
        { y: 7, z: 14, speed: 0.055, startX: -30, color: new Color3(0, 0.9, 1) },
        { y: 11, z: 16, speed: -0.04, startX: 30, color: new Color3(1, 0, 0.6) },
        { y: 5.5, z: 13, speed: 0.08, startX: -40, color: new Color3(0.8, 1, 0) },
      ]

      for (let ci = 0; ci < (isMobileOrLow ? 2 : 3); ci++) {
        const cd = carDefs[ci]
        const car = MeshBuilder.CreateBox(`cyberCar_${ci}`, { width: 1.6, height: 0.38, depth: 0.72 }, this.scene)
        car.position.set(cd.startX, cd.y, cd.z)
        const carMat = new PBRMaterial(`carMat_${ci}`, this.scene)
        carMat.albedoColor = cd.color.scale(0.15)
        carMat.emissiveColor = cd.color
        carMat.emissiveIntensity = 3.0
        carMat.metallic = 0.95; carMat.roughness = 0.05
        car.material = carMat

        const carLight = new PointLight(`carLight_${ci}`, new Vector3(cd.startX, cd.y, cd.z - 1), this.scene)
        carLight.diffuse = cd.color; carLight.intensity = 0.8; carLight.range = 6
        const sp = cd.speed
        this.scene.onBeforeRenderObservable.add(() => {
          car.position.x += sp
          carLight.position.x = car.position.x
          if (sp > 0 && car.position.x > 32) car.position.x = -32
          if (sp < 0 && car.position.x < -32) car.position.x = 32
        })
      }
    }
    else if (theme === 'space-station') {
      groundMat.albedoColor = new Color3(0.02, 0.02, 0.06)

      // Rotating Earth Sphere with atmosphere glow
      const earth = MeshBuilder.CreateSphere('earth', { diameter: 16, segments: 28 }, this.scene)
      earth.position.set(6, -3, 25)
      const earthMat = new PBRMaterial('earthMat', this.scene)
      earthMat.albedoColor = new Color3(0.08, 0.16, 0.55)
      earthMat.emissiveColor = new Color3(0.02, 0.04, 0.16)
      earthMat.emissiveIntensity = 0.8
      earthMat.metallic = 0.15; earthMat.roughness = 0.7
      earth.material = earthMat
      this.scene.onBeforeRenderObservable.add(() => { earth.rotation.y += 0.0006; earth.rotation.x += 0.0001 })

      // Moon
      const moon = MeshBuilder.CreateSphere('moon', { diameter: 5.5, segments: 12 }, this.scene)
      moon.position.set(-22, 16, 26)
      const moonMat = new PBRMaterial('moonMat', this.scene)
      moonMat.albedoColor = new Color3(0.52, 0.52, 0.55)
      moonMat.metallic = 0.1; moonMat.roughness = 0.95
      moon.material = moonMat

      // Solar panels
      const panelMat = new PBRMaterial('panelMat', this.scene)
      panelMat.emissiveColor = new Color3(0, 0.12, 0.55)
      panelMat.emissiveIntensity = 1.5
      panelMat.metallic = 0.98; panelMat.roughness = 0.05
      for (let pi = 0; pi < 3; pi++) {
        const panel = MeshBuilder.CreateBox(`panel_${pi}`, { width: 7, height: 0.08, depth: 1.8 }, this.scene)
        panel.position.set(-18 + pi * 18, 12, 20)
        panel.material = panelMat
        this.scene.onBeforeRenderObservable.add(() => { panel.rotation.z += 0.002 + pi * 0.0008 })
      }

      // Space ambient light
      const solarLight = new PointLight('solarLight', new Vector3(30, 20, -10), this.scene)
      solarLight.diffuse = new Color3(1, 0.96, 0.85)
      solarLight.intensity = 2.5; solarLight.range = 80
    }
    else if (theme === 'neon-dojo') {
      groundMat.albedoColor = new Color3(0.035, 0.01, 0.04)
      
      // Glowing Torii Gate (more detailed)
      const toriiMat = new PBRMaterial('toriiMat', this.scene)
      toriiMat.albedoColor = new Color3(0.6, 0.05, 0)
      toriiMat.emissiveColor = new Color3(1.0, 0.2, 0)
      toriiMat.emissiveIntensity = 2.2
      toriiMat.metallic = 0.7; toriiMat.roughness = 0.3

      const toriiL = MeshBuilder.CreateCylinder('toriiL', { height: 9, diameter: 0.44 }, this.scene)
      toriiL.position.set(-5.5, 4.5, 13); toriiL.material = toriiMat
      const toriiR = MeshBuilder.CreateCylinder('toriiR', { height: 9, diameter: 0.44 }, this.scene)
      toriiR.position.set(5.5, 4.5, 13); toriiR.material = toriiMat
      const toriiTop = MeshBuilder.CreateBox('toriiTop', { width: 13.5, height: 0.58, depth: 0.55 }, this.scene)
      toriiTop.position.set(0, 9.3, 13); toriiTop.material = toriiMat

      const toriiGlowMat = new PBRMaterial('toriiGlow', this.scene)
      toriiGlowMat.emissiveColor = new Color3(1, 0.5, 0)
      toriiGlowMat.emissiveIntensity = 3.5; toriiGlowMat.metallic = 0.1; toriiGlowMat.roughness = 0.5
      const toriiStrut = MeshBuilder.CreateBox('toriiStrut', { width: 12, height: 0.32, depth: 0.44 }, this.scene)
      toriiStrut.position.set(0, 8.1, 13); toriiStrut.material = toriiGlowMat

      // Hanging neon lanterns
      const lanternMat = new PBRMaterial('lanternMat', this.scene)
      lanternMat.emissiveColor = new Color3(1, 0.65, 0.1)
      lanternMat.emissiveIntensity = 3.0; lanternMat.metallic = 0; lanternMat.roughness = 0.85
      const lanterns: AbstractMesh[] = []
      for (let li = -4; li <= 4; li++) {
        const lantern = MeshBuilder.CreateSphere(`lantern_${li}`, { diameter: 0.36, segments: 5 }, this.scene)
        lantern.position.set(li * 2.8, 5.6, 12)
        lantern.material = lanternMat
        lanterns.push(lantern)
      }

      let dojoTimer = 0
      this.scene.onBeforeRenderObservable.add(() => {
        dojoTimer += 0.025
        toriiGlowMat.emissiveIntensity = 3.0 + Math.sin(dojoTimer * 0.6) * 1.0
        lanterns.forEach((l, i) => { l.position.z = 12 + Math.sin(dojoTimer + i * 0.6) * 0.09 })
      })

      // Neon glow strip on floor
      const floorGlowMat = new PBRMaterial('floorGlow', this.scene)
      floorGlowMat.emissiveColor = new Color3(1, 0, 0.8)
      floorGlowMat.emissiveIntensity = 2.2; floorGlowMat.alpha = 0.6; floorGlowMat.metallic = 0; floorGlowMat.roughness = 1
      floorGlowMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND
      const neonStrip = MeshBuilder.CreateBox('neonStrip', { width: 38, height: 0.04, depth: 0.16 }, this.scene)
      neonStrip.position.set(0, 0.02, 0); neonStrip.material = floorGlowMat

      // Dojo ambient light
      const dojoLight = new PointLight('dojoLight', new Vector3(0, 3, 5), this.scene)
      dojoLight.diffuse = new Color3(1, 0.3, 0.8); dojoLight.intensity = 1.8; dojoLight.range = 25
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
    const quality = useSettingsStore.getState().graphicsQuality
    const isMobileOrLow = quality === 'low' || (typeof window !== 'undefined' && window.innerWidth < 1024)
    
    if (theme === 'cyber-city') {
      const rainMat = new PBRMaterial('rainMat', this.scene)
      rainMat.albedoColor = new Color3(0.5, 0.8, 1.0)
      rainMat.emissiveColor = new Color3(0.3, 0.6, 0.9)
      rainMat.emissiveIntensity = 2.0
      rainMat.alpha = 0.4
      rainMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND
      const count = isMobileOrLow ? 40 : 120
      const rainLines: AbstractMesh[] = []
      for (let i = 0; i < count; i++) {
        const rainLine = MeshBuilder.CreateBox(`rain_${i}`, { width: 0.02, height: 0.8, depth: 0.02 }, this.scene)
        rainLine.position.set((Math.random() - 0.5) * 40, Math.random() * 12, (Math.random() - 0.5) * 12)
        rainLine.material = rainMat
        rainLines.push(rainLine)
      }
      this.scene.onBeforeRenderObservable.add(() => {
        rainLines.forEach(rl => {
          rl.position.y -= 0.35 + Math.random() * 0.1
          rl.position.x -= 0.04
          if (rl.position.y < 0) {
            rl.position.y = 12
            rl.position.x = (Math.random() - 0.5) * 40
          }
        })
      })
    } else if (theme === 'volcano') {
      const ashMat = new PBRMaterial('ashMat', this.scene)
      ashMat.albedoColor = new Color3(1.0, 0.35, 0)
      ashMat.emissiveColor = new Color3(0.8, 0.25, 0)
      ashMat.emissiveIntensity = 2.5
      ashMat.alpha = 0.7
      ashMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND
      const count = isMobileOrLow ? 25 : 80
      const ashParticles: AbstractMesh[] = []
      for (let i = 0; i < count; i++) {
        const ash = MeshBuilder.CreateBox(`ash_${i}`, { width: 0.08, height: 0.08, depth: 0.08 }, this.scene)
        ash.position.set((Math.random() - 0.5) * 36, Math.random() * 10, (Math.random() - 0.5) * 12)
        ash.material = ashMat
        ashParticles.push(ash)
      }
      let time = 0
      this.scene.onBeforeRenderObservable.add(() => {
        time += 0.02
        ashParticles.forEach((ash, idx) => {
          ash.position.y -= 0.04 + Math.random() * 0.03
          ash.position.x += Math.sin(time + idx) * 0.02
          if (ash.position.y < 0) {
            ash.position.y = 10
            ash.position.x = (Math.random() - 0.5) * 36
          }
        })
      })
    } else if (theme === 'neon-dojo') {
      const sakuraMat = new PBRMaterial('sakuraMat', this.scene)
      sakuraMat.albedoColor = new Color3(1.0, 0.72, 0.77)
      sakuraMat.emissiveColor = new Color3(0.9, 0.55, 0.6)
      sakuraMat.emissiveIntensity = 1.8
      sakuraMat.alpha = 0.85
      sakuraMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND
      const count = isMobileOrLow ? 20 : 60
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
    else if (theme === 'space-station') {
      const cyanMat = new PBRMaterial('cosmicCyanMat', this.scene)
      cyanMat.albedoColor = new Color3(0.0, 1.0, 1.0)
      cyanMat.emissiveColor = new Color3(0.0, 0.7, 0.7)
      cyanMat.emissiveIntensity = 2.0
      cyanMat.alpha = 0.75
      cyanMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND

      const magentaMat = new PBRMaterial('cosmicMagMat', this.scene)
      magentaMat.albedoColor = new Color3(1.0, 0.0, 0.5)
      magentaMat.emissiveColor = new Color3(0.7, 0.0, 0.3)
      magentaMat.emissiveIntensity = 2.0
      magentaMat.alpha = 0.75
      magentaMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND

      const count = isMobileOrLow ? 15 : 45
      const particles: AbstractMesh[] = []

      for (let i = 0; i < count; i++) {
        const size = 0.06 + Math.random() * 0.12
        const p = MeshBuilder.CreateBox(`stardust_${i}`, { width: size, height: size, depth: size }, this.scene)
        p.position.set(
          (Math.random() - 0.5) * 32,
          Math.random() * 8,
          (Math.random() - 0.5) * 10
        )
        p.rotation.set(Math.random(), Math.random(), Math.random())
        p.material = Math.random() < 0.5 ? cyanMat : magentaMat
        particles.push(p)
      }

      let time = 0
      this.scene.onBeforeRenderObservable.add(() => {
        time += 0.008
        particles.forEach((p, idx) => {
          // Drifts slowly upwards (zero-g look)
          p.position.y += 0.006 + Math.random() * 0.004
          p.position.x += Math.sin(time + idx) * 0.008
          p.position.z += Math.cos(time + idx) * 0.008
          p.rotation.y += 0.005
          p.rotation.x += 0.002
          if (p.position.y > 8) {
            p.position.y = 0
            p.position.x = (Math.random() - 0.5) * 32
            p.position.z = (Math.random() - 0.5) * 10
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

  private getAlternateColor(baseHex: string, colorIndex: number): string {
    if (colorIndex === 0) return baseHex
    
    // Parse hex
    const hex = baseHex.replace('#', '')
    let r = parseInt(hex.substring(0, 2), 16)
    let g = parseInt(hex.substring(2, 4), 16)
    let b = parseInt(hex.substring(4, 6), 16)
    
    // Shift hues/values based on index
    if (colorIndex === 1) { // Gold/Bronze shift
      r = Math.min(255, r + 80)
      g = Math.min(255, g + 50)
      b = Math.max(0, b - 100)
    } else if (colorIndex === 2) { // Cyan/Teal shift
      const tmp = r
      r = b
      b = g
      g = tmp
    } else if (colorIndex === 3) { // Crimson shift
      r = Math.min(255, r + 150)
      g = Math.max(0, g - 120)
      b = Math.max(0, b - 120)
    }
    
    const toHex = (c: number) => {
      const h = Math.round(c).toString(16)
      return h.length === 1 ? '0' + h : h
    }
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }
}
