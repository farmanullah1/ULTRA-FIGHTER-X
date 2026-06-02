export interface StageDef {
  id: string
  name: string
  subtitle: string
  modelPath: string
  floorY: number
  skyboxPath?: string
  ambientColor: string
  lightIntensity: number
  musicTrack: string
  theme: 'cyber-city' | 'volcano' | 'space-station' | 'neon-dojo'
}

export const STAGES: StageDef[] = [
  {
    id: 'cyber-city',
    name: 'Neon Tokyo',
    subtitle: 'Sector 7 - Night',
    modelPath: '/assets/models/stages/cyber_city.glb',
    floorY: 0,
    ambientColor: '#0A0A20',
    lightIntensity: 1.2,
    musicTrack: 'cyber_city_theme',
    theme: 'cyber-city'
  },
  {
    id: 'volcano',
    name: 'Volcano Forge',
    subtitle: 'Chamber of Embers',
    modelPath: '/assets/models/stages/volcano.glb',
    floorY: 0,
    ambientColor: '#200500',
    lightIntensity: 1.5,
    musicTrack: 'volcano_theme',
    theme: 'volcano'
  },
  {
    id: 'space-station',
    name: 'Void Station',
    subtitle: 'Orbiting Earth',
    modelPath: '/assets/models/stages/space_station.glb',
    floorY: 0,
    ambientColor: '#050510',
    lightIntensity: 1.0,
    musicTrack: 'space_station_theme',
    theme: 'space-station'
  },
  {
    id: 'neon-dojo',
    name: 'Neon Dojo',
    subtitle: 'Cyber-Zen Garden',
    modelPath: '/assets/models/stages/neon_dojo.glb',
    floorY: 0,
    ambientColor: '#100510',
    lightIntensity: 1.3,
    musicTrack: 'neon_dojo_theme',
    theme: 'neon-dojo'
  }
]
