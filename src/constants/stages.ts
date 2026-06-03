export interface StageDef {
  id: string
  name: string
  subtitle: string
  description: string
  modelPath: string
  floorY: number
  skyboxPath?: string
  ambientColor: string
  lightIntensity: number
  musicTrack: string
  theme: 'cyber-city' | 'volcano' | 'space-station' | 'neon-dojo'
  isRingOut: boolean
  bounds: { x: number; z: number }
}

export const STAGES: StageDef[] = [
  {
    id: 'cyber-city',
    name: 'Neon Tokyo',
    subtitle: 'Sector 7 — Night District',
    description: 'A rain-slicked alleyway in the heart of Sector 7. Neon signs flicker as cyber-drones patrol the skies above. The crowd watches from elevated platforms, hidden in shadow, as lightning tears across the sky.',
    modelPath: '/assets/models/stages/cyber_city.glb',
    floorY: 0,
    ambientColor: '#0A0A20',
    lightIntensity: 1.2,
    musicTrack: 'cyber_city_theme',
    theme: 'cyber-city',
    isRingOut: false,
    bounds: { x: 16.0, z: 8.0 }
  },
  {
    id: 'volcano',
    name: 'Volcano Forge',
    subtitle: 'Chamber of Embers',
    description: 'A battlefield forged in fire and ancient stone. Lava bubbles through cracks in the obsidian floor as ash rains from above. Only the strongest survive the heat — and each other.',
    modelPath: '/assets/models/stages/volcano.glb',
    floorY: 0,
    ambientColor: '#200500',
    lightIntensity: 1.5,
    musicTrack: 'volcano_theme',
    theme: 'volcano',
    isRingOut: false,
    bounds: { x: 14.0, z: 7.0 }
  },
  {
    id: 'space-station',
    name: 'Void Station',
    subtitle: 'Orbiting Earth — Zero-G Arena',
    description: 'A combat deck aboard the Void Station in low Earth orbit. With no atmosphere to muffle the chaos, every punch carries the weight of the cosmos. Fall too far and you\'re lost to the void forever.',
    modelPath: '/assets/models/stages/space_station.glb',
    floorY: 0,
    ambientColor: '#050510',
    lightIntensity: 1.0,
    musicTrack: 'space_station_theme',
    theme: 'space-station',
    isRingOut: true,
    bounds: { x: 12.0, z: 6.0 }
  },
  {
    id: 'neon-dojo',
    name: 'Neon Dojo',
    subtitle: 'Cyber-Zen Garden',
    description: 'An ancient dojo reborn in a neon-drenched cyberpunk world. Sakura petals fall alongside data packets as holographic katanas line the walls. The spirit of the warrior and the machine merge as one.',
    modelPath: '/assets/models/stages/neon_dojo.glb',
    floorY: 0,
    ambientColor: '#100510',
    lightIntensity: 1.3,
    musicTrack: 'neon_dojo_theme',
    theme: 'neon-dojo',
    isRingOut: true,
    bounds: { x: 11.5, z: 5.5 }
  }
]
