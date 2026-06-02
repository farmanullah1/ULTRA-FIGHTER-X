import { Scene, SceneLoader, PBRMaterial, Texture, Color3, AnimationGroup, TransformNode, AbstractMesh } from '@babylonjs/core'
import '@babylonjs/loaders/glTF'

export class AssetManager {
  private scene: Scene

  constructor(scene: Scene) {
    this.scene = scene
  }

  async loadCharacterModel(modelPath: string): Promise<{
    root: TransformNode
    mesh: AbstractMesh
    animations: Map<string, AnimationGroup>
  }> {
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
