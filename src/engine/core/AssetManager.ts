import { Scene, SceneLoader, PBRMaterial, Texture, Color3, AnimationGroup, TransformNode, AbstractMesh, MeshBuilder, StandardMaterial } from '@babylonjs/core'
import '@babylonjs/loaders/glTF'

export class AssetManager {
  private scene: Scene

  constructor(scene: Scene) {
    this.scene = scene
  }

  async loadCharacterModel(modelPath: string, color: string): Promise<{
    root: TransformNode
    mesh: AbstractMesh
    animations: Map<string, AnimationGroup>
  }> {
    try {
      const result = await SceneLoader.ImportMeshAsync('', modelPath, '', this.scene)
      const root = new TransformNode('charRoot', this.scene)
      
      // Parent all meshes to root
      result.meshes.forEach(mesh => {
        if (!mesh.parent) mesh.parent = root
      })

      const animations = new Map<string, AnimationGroup>()
      result.animationGroups.forEach(ag => {
        animations.set(ag.name, ag)
        ag.stop()
      })

      return {
        root,
        mesh: result.meshes[0],
        animations
      }
    } catch (e) {
      console.warn(`Failed to load model at ${modelPath}, creating procedural placeholder.`, e)
      return this.createProceduralCharacter(color)
    }
  }

  private createProceduralCharacter(colorHex: string): {
    root: TransformNode
    mesh: AbstractMesh
    animations: Map<string, AnimationGroup>
  } {
    const root = new TransformNode('charRootPlaceholder', this.scene)
    
    // Simple humanoid representation: Head, Body, Arms, Legs
    const head = MeshBuilder.CreateBox('head', { size: 0.4 }, this.scene)
    head.position.y = 2.2
    
    const body = MeshBuilder.CreateBox('body', { width: 0.8, height: 1.2, depth: 0.4 }, this.scene)
    body.position.y = 1.4
    
    const legL = MeshBuilder.CreateBox('legL', { width: 0.3, height: 0.8, depth: 0.3 }, this.scene)
    legL.position.set(-0.2, 0.4, 0)
    
    const legR = MeshBuilder.CreateBox('legR', { width: 0.3, height: 0.8, depth: 0.3 }, this.scene)
    legR.position.set(0.2, 0.4, 0)

    const armL = MeshBuilder.CreateBox('armL', { width: 0.25, height: 1, depth: 0.25 }, this.scene)
    armL.position.set(-0.55, 1.5, 0)

    const armR = MeshBuilder.CreateBox('armR', { width: 0.25, height: 1, depth: 0.25 }, this.scene)
    armR.position.set(0.55, 1.5, 0)

    const meshes = [head, body, legL, legR, armL, armR]
    const mat = new PBRMaterial('placeholderMat', this.scene)
    mat.albedoColor = Color3.FromHexString(colorHex)
    mat.metallic = 0.5
    mat.roughness = 0.2
    
    meshes.forEach(m => {
      m.parent = root
      m.material = mat
    })

    return {
      root,
      mesh: body,
      animations: new Map() // No animations for placeholder boxes yet
    }
  }

  createStage(_theme: string): void {
    const ground = MeshBuilder.CreateGround('ground', { width: 50, height: 20 }, this.scene)
    const groundMat = new PBRMaterial('groundMat', this.scene)
    groundMat.albedoColor = new Color3(0.02, 0.02, 0.05)
    groundMat.metallic = 0.9
    groundMat.roughness = 0.1
    groundMat.reflectionColor = new Color3(0.5, 0.5, 0.5)
    ground.material = groundMat
    ground.receiveShadows = true
    
    // Add some "cyber" grid lines with bloom-ready emission
    const gridMat = new StandardMaterial('gridMat', this.scene)
    gridMat.emissiveColor = new Color3(0, 0.8, 1)
    gridMat.wireframe = true
    gridMat.alpha = 0.1
    
    const grid = MeshBuilder.CreateGround('grid', { width: 50, height: 20, subdivisions: 20 }, this.scene)
    grid.position.y = 0.01
    grid.material = gridMat

    // Add background industrial pillars for depth
    for (let i = -5; i <= 5; i++) {
      const pillar = MeshBuilder.CreateBox(`pillar_${i}`, { width: 2, height: 20, depth: 2 }, this.scene)
      pillar.position.set(i * 8, 10, 10)
      const pMat = new PBRMaterial(`pMat_${i}`, this.scene)
      pMat.albedoColor = new Color3(0.1, 0.1, 0.15)
      pMat.metallic = 0.8
      pMat.roughness = 0.3
      pMat.emissiveColor = new Color3(0, 0.2, 0.4)
      pillar.material = pMat
      pillar.receiveShadows = true
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
    
    mat.metallic = config.metallic ?? 0
    mat.roughness = config.roughness ?? 0.5
    
    if (config.emissiveColor) {
      mat.emissiveColor = config.emissiveColor
      mat.emissiveIntensity = config.emissiveIntensity ?? 1
    }

    return mat
  }
}
