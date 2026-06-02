import type { CharacterDef } from '@game-types/character.types'

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'kai-storm',
    name: 'Kai Storm',
    title: 'The Storm Caller',
    lore: 'A rogue cyber-ninja who harnesses the power of static electricity to strike with blinding speed.',
    difficulty: 1,
    archetype: 'rushdown',
    modelPath: '/assets/models/kai_storm.glb',
    stats: { health: 1000, walkSpeed: 0.15, dashSpeed: 0.3, jumpHeight: 0.4, gravity: -0.015, weight: 1, meterMax: 1000 },
    colors: { primary: '#00FFFF', secondary: '#FFFFFF', aura: '#00FFFF', healthBarColor: '#00FFFF', meterColor: '#00FFFF' },
    moves: [
      {
        id: 'punch-light', name: 'Light Punch', input: 'LP', inputSequence: ['P'], damage: 30, meterGain: 10, meterCost: 0, cancelable: true, invincible: false, startup: 4, active: 3, recovery: 8, onHit: 4, onBlock: 0, animationState: 'punch-light', type: 'light-punch',
        hitboxes: [{ frameStart: 4, frameEnd: 6, x: 0.5, y: 1.2, z: 0, width: 0.6, height: 0.4, depth: 0.4, type: 'attack', damage: 30 }]
      },
      {
        id: 'kick-light', name: 'Light Kick', input: 'LK', inputSequence: ['K'], damage: 25, meterGain: 10, meterCost: 0, cancelable: true, invincible: false, startup: 4, active: 4, recovery: 7, onHit: 5, onBlock: 1, animationState: 'kick-light', type: 'light-kick',
        hitboxes: [{ frameStart: 4, frameEnd: 7, x: 0.6, y: 0.5, z: 0, width: 0.7, height: 0.3, depth: 0.3, type: 'attack', damage: 25 }]
      },
      {
        id: 'punch-heavy', name: 'Heavy Punch', input: 'HP', inputSequence: ['HP'], damage: 50, meterGain: 20, meterCost: 0, cancelable: true, invincible: false, startup: 7, active: 4, recovery: 14, onHit: 5, onBlock: -2, animationState: 'punch-heavy', type: 'heavy-punch',
        hitboxes: [{ frameStart: 7, frameEnd: 10, x: 0.6, y: 1.3, z: 0, width: 0.8, height: 0.4, depth: 0.4, type: 'attack', damage: 50, knockback: { x: 0.35, y: 0.1, z: 0 } }]
      },
      {
        id: 'kick-heavy', name: 'Heavy Kick', input: 'HK', inputSequence: ['HK'], damage: 60, meterGain: 25, meterCost: 0, cancelable: false, invincible: false, startup: 9, active: 5, recovery: 16, onHit: 8, onBlock: -4, animationState: 'kick-heavy', type: 'heavy-kick',
        hitboxes: [{ frameStart: 9, frameEnd: 13, x: 0.7, y: 0.7, z: 0, width: 0.9, height: 0.4, depth: 0.4, type: 'attack', damage: 60, knockback: { x: 0.55, y: 0.35, z: 0 } }]
      },
      {
        id: 'special-bolt', name: 'Static Bolt', input: '⬇️↘️➡️ + P', inputSequence: ['D', 'DF', 'F', 'P'], damage: 60, meterGain: 50, meterCost: 0, cancelable: false, invincible: false, startup: 12, active: 5, recovery: 20, onHit: 10, onBlock: -5, animationState: 'special-1', type: 'special', hitboxes: [],
        projectile: { speed: 0.4, width: 0.6, height: 0.6, depth: 0.6, damage: 60, color: '#00FFFF', glowColor: '#00FFFF', lifespan: 120 }
      },
      {
        id: 'special-kick', name: 'Thunder Kick', input: '⬇️↙️⬅️ + K', inputSequence: ['D', 'DB', 'B', 'K'], damage: 100, meterGain: 80, meterCost: 0, cancelable: false, invincible: true, startup: 8, active: 15, recovery: 25, onHit: 20, onBlock: -15, animationState: 'special-2', type: 'special',
        hitboxes: [{ frameStart: 8, frameEnd: 23, x: 0.5, y: 1.0, z: 0, width: 1.5, height: 1.0, depth: 0.8, type: 'attack', damage: 100, knockback: { x: 0.5, y: 0.3, z: 0 } }]
      },
      {
        id: 'super-storm', name: 'Raging Storm', input: '⬇️↘️➡️⬇️↘️➡️ + P', inputSequence: ['D', 'DF', 'F', 'D', 'DF', 'F', 'P'], damage: 300, meterGain: 0, meterCost: 1000, cancelable: false, invincible: true, startup: 10, active: 20, recovery: 50, onHit: 80, onBlock: -30, animationState: 'super', type: 'super',
        hitboxes: [{ frameStart: 10, frameEnd: 30, x: 0.5, y: 1.0, z: 0, width: 3.0, height: 3.0, depth: 1.0, type: 'attack', damage: 300, knockback: { x: 1.0, y: 0.5, z: 0 } }]
      }
    ]
  },
  {
    id: 'viper-x',
    name: 'Viper X',
    title: 'The Toxic Shadow',
    lore: 'An assassin specializing in chemical warfare, using corrosive energy to dissolve any defense.',
    difficulty: 2,
    archetype: 'zoner',
    modelPath: '/assets/models/viper_x.glb',
    stats: { health: 900, walkSpeed: 0.12, dashSpeed: 0.25, jumpHeight: 0.35, gravity: -0.015, weight: 0.9, meterMax: 1000 },
    colors: { primary: '#39FF14', secondary: '#000000', aura: '#39FF14', healthBarColor: '#39FF14', meterColor: '#39FF14' },
    moves: [
      {
        id: 'punch-light', name: 'Toxic Jab', input: 'LP', inputSequence: ['P'], damage: 25, meterGain: 10, meterCost: 0, cancelable: true, invincible: false, startup: 3, active: 3, recovery: 6, onHit: 5, onBlock: 1, animationState: 'punch-light', type: 'light-punch',
        hitboxes: [{ frameStart: 3, frameEnd: 5, x: 0.4, y: 1.3, z: 0, width: 0.5, height: 0.3, depth: 0.3, type: 'attack', damage: 25 }]
      },
      {
        id: 'kick-light', name: 'Acid Tap', input: 'LK', inputSequence: ['K'], damage: 20, meterGain: 10, meterCost: 0, cancelable: true, invincible: false, startup: 5, active: 3, recovery: 8, onHit: 4, onBlock: 0, animationState: 'kick-light', type: 'light-kick',
        hitboxes: [{ frameStart: 5, frameEnd: 7, x: 0.7, y: 0.4, z: 0, width: 0.8, height: 0.3, depth: 0.3, type: 'attack', damage: 20 }]
      },
      {
        id: 'punch-heavy', name: 'Venom Strike', input: 'HP', inputSequence: ['HP'], damage: 45, meterGain: 20, meterCost: 0, cancelable: true, invincible: false, startup: 8, active: 5, recovery: 15, onHit: 4, onBlock: -4, animationState: 'punch-heavy', type: 'heavy-punch',
        hitboxes: [{ frameStart: 8, frameEnd: 12, x: 0.7, y: 1.2, z: 0, width: 0.9, height: 0.4, depth: 0.4, type: 'attack', damage: 45, knockback: { x: 0.3, y: 0.1, z: 0 } }]
      },
      {
        id: 'kick-heavy', name: 'Sweep Spire', input: 'HK', inputSequence: ['HK'], damage: 55, meterGain: 25, meterCost: 0, cancelable: false, invincible: false, startup: 11, active: 5, recovery: 18, onHit: 9, onBlock: -6, animationState: 'kick-heavy', type: 'heavy-kick',
        hitboxes: [{ frameStart: 11, frameEnd: 15, x: 0.8, y: 0.3, z: 0, width: 1.1, height: 0.3, depth: 0.3, type: 'attack', damage: 55, knockback: { x: 0.45, y: 0.4, z: 0 } }]
      },
      {
        id: 'special-dart', name: 'Toxic Dart', input: '⬇️↘️➡️ + P', inputSequence: ['D', 'DF', 'F', 'P'], damage: 45, meterGain: 40, meterCost: 0, cancelable: false, invincible: false, startup: 10, active: 4, recovery: 18, onHit: 8, onBlock: -4, animationState: 'special-1', type: 'special', hitboxes: [],
        projectile: { speed: 0.5, width: 0.4, height: 0.2, depth: 0.2, damage: 45, color: '#39FF14', glowColor: '#39FF14', lifespan: 150 }
      },
      {
        id: 'special-slide', name: 'Viper Slide', input: '⬇️↘️➡️ + K', inputSequence: ['D', 'DF', 'F', 'K'], damage: 70, meterGain: 60, meterCost: 0, cancelable: false, invincible: false, startup: 12, active: 10, recovery: 20, onHit: 15, onBlock: -10, animationState: 'special-2', type: 'special',
        hitboxes: [{ frameStart: 12, frameEnd: 22, x: 0.6, y: 0.2, z: 0, width: 1.2, height: 0.4, depth: 0.5, type: 'attack', damage: 70, knockback: { x: 0.3, y: 0.2, z: 0 } }]
      },
      {
        id: 'super-venom', name: 'Venom Overdrive', input: '⬇️↘️➡️⬇️↘️➡️ + K', inputSequence: ['D', 'DF', 'F', 'D', 'DF', 'F', 'K'], damage: 320, meterGain: 0, meterCost: 1000, cancelable: false, invincible: true, startup: 8, active: 15, recovery: 40, onHit: 60, onBlock: -20, animationState: 'super', type: 'super',
        hitboxes: [{ frameStart: 8, frameEnd: 23, x: 0.5, y: 0.5, z: 0, width: 5.0, height: 1.0, depth: 1.0, type: 'attack', damage: 320, knockback: { x: 0.5, y: 1.0, z: 0 } }]
      }
    ]
  },
  {
    id: 'iron-claw',
    name: 'Iron Claw',
    title: 'The Steel Titan',
    lore: 'A former underground pit-fighter rebuilt with heavy industrial hydraulics for crushing power.',
    difficulty: 3,
    archetype: 'grappler',
    modelPath: '/assets/models/iron_claw.glb',
    stats: { health: 1200, walkSpeed: 0.08, dashSpeed: 0.18, jumpHeight: 0.3, gravity: -0.018, weight: 1.5, meterMax: 1000 },
    colors: { primary: '#FF6600', secondary: '#444444', aura: '#FF6600', healthBarColor: '#FF6600', meterColor: '#FF6600' },
    moves: [
      {
        id: 'punch-light', name: 'Heavy Jab', input: 'LP', inputSequence: ['P'], damage: 40, meterGain: 15, meterCost: 0, cancelable: true, invincible: false, startup: 6, active: 3, recovery: 10, onHit: 2, onBlock: -2, animationState: 'punch-light', type: 'light-punch',
        hitboxes: [{ frameStart: 6, frameEnd: 8, x: 0.4, y: 1.5, z: 0, width: 0.6, height: 0.4, depth: 0.4, type: 'attack', damage: 40 }]
      },
      {
        id: 'kick-light', name: 'Piston Foot', input: 'LK', inputSequence: ['K'], damage: 35, meterGain: 15, meterCost: 0, cancelable: true, invincible: false, startup: 7, active: 4, recovery: 11, onHit: 3, onBlock: -1, animationState: 'kick-light', type: 'light-kick',
        hitboxes: [{ frameStart: 7, frameEnd: 10, x: 0.5, y: 0.4, z: 0, width: 0.7, height: 0.4, depth: 0.4, type: 'attack', damage: 35 }]
      },
      {
        id: 'punch-heavy', name: 'Titan Hook', input: 'HP', inputSequence: ['HP'], damage: 75, meterGain: 25, meterCost: 0, cancelable: true, invincible: false, startup: 10, active: 5, recovery: 20, onHit: 6, onBlock: -5, animationState: 'punch-heavy', type: 'heavy-punch',
        hitboxes: [{ frameStart: 10, frameEnd: 14, x: 0.6, y: 1.2, z: 0, width: 0.9, height: 0.5, depth: 0.5, type: 'attack', damage: 75, knockback: { x: 0.6, y: 0.2, z: 0 } }]
      },
      {
        id: 'kick-heavy', name: 'Iron Stomp', input: 'HK', inputSequence: ['HK'], damage: 80, meterGain: 30, meterCost: 0, cancelable: false, invincible: false, startup: 13, active: 6, recovery: 24, onHit: 12, onBlock: -8, animationState: 'kick-heavy', type: 'heavy-kick',
        hitboxes: [{ frameStart: 13, frameEnd: 18, x: 0.7, y: 0.5, z: 0, width: 1.0, height: 0.5, depth: 0.5, type: 'attack', damage: 80, knockback: { x: 0.8, y: 0.5, z: 0 } }]
      },
      {
        id: 'special-grab', name: 'Steel Press', input: '⬇️↘️➡️ + K', inputSequence: ['D', 'DF', 'F', 'K'], damage: 150, meterGain: 100, meterCost: 0, cancelable: false, invincible: false, startup: 15, active: 5, recovery: 30, onHit: 40, onBlock: -20, animationState: 'special-1', type: 'special',
        hitboxes: [{ frameStart: 15, frameEnd: 19, x: 0.2, y: 1.0, z: 0, width: 1.5, height: 1.5, depth: 1.0, type: 'attack', damage: 150, knockback: { x: 0.1, y: 0.8, z: 0 } }]
      },
      {
        id: 'super-giga', name: 'Giga Impact', input: '⬇️↘️➡️⬇️↘️➡️ + P', inputSequence: ['D', 'DF', 'F', 'D', 'DF', 'F', 'P'], damage: 350, meterGain: 0, meterCost: 1000, cancelable: false, invincible: true, startup: 10, active: 10, recovery: 60, onHit: 100, onBlock: -40, animationState: 'super', type: 'super',
        hitboxes: [{ frameStart: 10, frameEnd: 19, x: 0.5, y: 1.0, z: 0, width: 2.5, height: 2.0, depth: 1.5, type: 'attack', damage: 350, knockback: { x: 0.8, y: 0.4, z: 0 } }]
      }
    ]
  },
  {
    id: 'nova-star',
    name: 'Nova Star',
    title: 'The Celestial Guard',
    lore: 'An elite enforcer from the orbital colonies, wielding concentrated starlight and gravity tech.',
    difficulty: 2,
    archetype: 'balanced',
    modelPath: '/assets/models/nova_star.glb',
    stats: { health: 1000, walkSpeed: 0.13, dashSpeed: 0.28, jumpHeight: 0.38, gravity: -0.015, weight: 1.1, meterMax: 1000 },
    colors: { primary: '#FF00FF', secondary: '#FFFFFF', aura: '#FF00FF', healthBarColor: '#FF00FF', meterColor: '#FF00FF' },
    moves: [
      {
        id: 'punch-light', name: 'Star Jab', input: 'LP', inputSequence: ['P'], damage: 30, meterGain: 12, meterCost: 0, cancelable: true, invincible: false, startup: 4, active: 3, recovery: 7, onHit: 4, onBlock: 0, animationState: 'punch-light', type: 'light-punch',
        hitboxes: [{ frameStart: 4, frameEnd: 6, x: 0.4, y: 1.4, z: 0, width: 0.5, height: 0.4, depth: 0.4, type: 'attack', damage: 30 }]
      },
      {
        id: 'kick-light', name: 'Nova Kick', input: 'LK', inputSequence: ['K'], damage: 25, meterGain: 12, meterCost: 0, cancelable: true, invincible: false, startup: 5, active: 3, recovery: 8, onHit: 4, onBlock: 0, animationState: 'kick-light', type: 'light-kick',
        hitboxes: [{ frameStart: 5, frameEnd: 7, x: 0.6, y: 0.5, z: 0, width: 0.7, height: 0.3, depth: 0.3, type: 'attack', damage: 25 }]
      },
      {
        id: 'punch-heavy', name: 'Stellar Punch', input: 'HP', inputSequence: ['HP'], damage: 55, meterGain: 22, meterCost: 0, cancelable: true, invincible: false, startup: 8, active: 4, recovery: 16, onHit: 5, onBlock: -3, animationState: 'punch-heavy', type: 'heavy-punch',
        hitboxes: [{ frameStart: 8, frameEnd: 11, x: 0.6, y: 1.3, z: 0, width: 0.8, height: 0.4, depth: 0.4, type: 'attack', damage: 55, knockback: { x: 0.4, y: 0.1, z: 0 } }]
      },
      {
        id: 'kick-heavy', name: 'Cosmic Heel', input: 'HK', inputSequence: ['HK'], damage: 65, meterGain: 25, meterCost: 0, cancelable: false, invincible: false, startup: 10, active: 5, recovery: 18, onHit: 8, onBlock: -5, animationState: 'kick-heavy', type: 'heavy-kick',
        hitboxes: [{ frameStart: 10, frameEnd: 14, x: 0.7, y: 0.7, z: 0, width: 0.9, height: 0.4, depth: 0.4, type: 'attack', damage: 65, knockback: { x: 0.6, y: 0.3, z: 0 } }]
      },
      {
        id: 'special-shot', name: 'Nova Shot', input: '⬇️↘️➡️ + P', inputSequence: ['D', 'DF', 'F', 'P'], damage: 55, meterGain: 45, meterCost: 0, cancelable: false, invincible: false, startup: 11, active: 4, recovery: 20, onHit: 10, onBlock: -2, animationState: 'special-1', type: 'special', hitboxes: [],
        projectile: { speed: 0.45, width: 0.5, height: 0.5, depth: 0.5, damage: 55, color: '#FF00FF', glowColor: '#FF00FF', lifespan: 130 }
      },
      {
        id: 'super-nova', name: 'Cosmic Burst', input: '⬇️↘️➡️⬇️↘️➡️ + P', inputSequence: ['D', 'DF', 'F', 'D', 'DF', 'F', 'P'], damage: 330, meterGain: 0, meterCost: 1000, cancelable: false, invincible: true, startup: 12, active: 25, recovery: 45, onHit: 90, onBlock: -25, animationState: 'super', type: 'super', hitboxes: [],
        projectile: { speed: 0.3, width: 2.0, height: 2.0, depth: 2.0, damage: 330, color: '#FFFFFF', glowColor: '#FF00FF', lifespan: 100 }
      }
    ]
  },
  {
    id: 'shadow-byte',
    name: 'Shadow Byte',
    title: 'The Glitch Hunter',
    lore: 'A digital consciousness inhabiting a physical shell, capable of flickering through reality.',
    difficulty: 3,
    archetype: 'tricky',
    modelPath: '/assets/models/shadow_byte.glb',
    stats: { health: 850, walkSpeed: 0.16, dashSpeed: 0.35, jumpHeight: 0.45, gravity: -0.012, weight: 0.8, meterMax: 1000 },
    colors: { primary: '#7700FF', secondary: '#00FFFF', aura: '#7700FF', healthBarColor: '#7700FF', meterColor: '#7700FF' },
    moves: [
      {
        id: 'punch-light', name: 'Data Tap', input: 'LP', inputSequence: ['P'], damage: 20, meterGain: 15, meterCost: 0, cancelable: true, invincible: false, startup: 3, active: 2, recovery: 5, onHit: 6, onBlock: 2, animationState: 'punch-light', type: 'light-punch',
        hitboxes: [{ frameStart: 3, frameEnd: 4, x: 0.3, y: 1.3, z: 0, width: 0.4, height: 0.3, depth: 0.3, type: 'attack', damage: 20 }]
      },
      {
        id: 'kick-light', name: 'Glitch Sweep', input: 'LK', inputSequence: ['K'], damage: 18, meterGain: 12, meterCost: 0, cancelable: true, invincible: false, startup: 4, active: 3, recovery: 6, onHit: 5, onBlock: 1, animationState: 'kick-light', type: 'light-kick',
        hitboxes: [{ frameStart: 4, frameEnd: 6, x: 0.5, y: 0.4, z: 0, width: 0.7, height: 0.3, depth: 0.3, type: 'attack', damage: 18 }]
      },
      {
        id: 'punch-heavy', name: 'Byte Smash', input: 'HP', inputSequence: ['HP'], damage: 45, meterGain: 20, meterCost: 0, cancelable: true, invincible: false, startup: 6, active: 4, recovery: 12, onHit: 6, onBlock: -1, animationState: 'punch-heavy', type: 'heavy-punch',
        hitboxes: [{ frameStart: 6, frameEnd: 9, x: 0.6, y: 1.2, z: 0, width: 0.7, height: 0.4, depth: 0.4, type: 'attack', damage: 45, knockback: { x: 0.45, y: 0.1, z: 0 } }]
      },
      {
        id: 'kick-heavy', name: 'Delete Kick', input: 'HK', inputSequence: ['HK'], damage: 50, meterGain: 25, meterCost: 0, cancelable: false, invincible: false, startup: 8, active: 5, recovery: 14, onHit: 7, onBlock: -3, animationState: 'kick-heavy', type: 'heavy-kick',
        hitboxes: [{ frameStart: 8, frameEnd: 12, x: 0.7, y: 0.6, z: 0, width: 0.9, height: 0.4, depth: 0.4, type: 'attack', damage: 50, knockback: { x: 0.5, y: 0.3, z: 0 } }]
      },
      {
        id: 'special-glitch', name: 'Glitch Strike', input: '⬇️↙️⬅️ + P', inputSequence: ['D', 'DB', 'B', 'P'], damage: 80, meterGain: 60, meterCost: 0, cancelable: false, invincible: true, startup: 14, active: 6, recovery: 22, onHit: 12, onBlock: -8, animationState: 'special-1', type: 'special',
        hitboxes: [{ frameStart: 14, frameEnd: 19, x: -1.5, y: 1.2, z: 0, width: 1.0, height: 1.0, depth: 0.5, type: 'attack', damage: 80, knockback: { x: 0.4, y: 0.2, z: 0 } }]
      },
      {
        id: 'super-delete', name: 'Force Delete', input: '⬇️↘️➡️⬇️↘️➡️ + P', inputSequence: ['D', 'DF', 'F', 'D', 'DF', 'F', 'P'], damage: 340, meterGain: 0, meterCost: 1000, cancelable: false, invincible: true, startup: 5, active: 5, recovery: 60, onHit: 120, onBlock: -50, animationState: 'super', type: 'super',
        hitboxes: [{ frameStart: 5, frameEnd: 10, x: 0.5, y: 1.0, z: 0, width: 2.0, height: 2.0, depth: 1.0, type: 'attack', damage: 340, knockback: { x: 2.0, y: 1.5, z: 0 } }]
      }
    ]
  },
  {
    id: 'phoenix-rise',
    name: 'Phoenix Rise',
    title: 'The Solar Flare',
    lore: 'A pilot who survived a sun-diving mission, now radiating intense thermal energy.',
    difficulty: 1,
    archetype: 'powerhouse',
    modelPath: '/assets/models/phoenix_rise.glb',
    stats: { health: 1100, walkSpeed: 0.1, dashSpeed: 0.22, jumpHeight: 0.32, gravity: -0.015, weight: 1.3, meterMax: 1000 },
    colors: { primary: '#FF003C', secondary: '#FFE600', aura: '#FF003C', healthBarColor: '#FF003C', meterColor: '#FF003C' },
    moves: [
      {
        id: 'punch-light', name: 'Heat Jab', input: 'LP', inputSequence: ['P'], damage: 45, meterGain: 20, meterCost: 0, cancelable: true, invincible: false, startup: 7, active: 3, recovery: 12, onHit: 1, onBlock: -3, animationState: 'punch-light', type: 'light-punch',
        hitboxes: [{ frameStart: 7, frameEnd: 9, x: 0.5, y: 1.5, z: 0, width: 0.6, height: 0.5, depth: 0.5, type: 'attack', damage: 45 }]
      },
      {
        id: 'kick-light', name: 'Flare Kick', input: 'LK', inputSequence: ['K'], damage: 38, meterGain: 18, meterCost: 0, cancelable: true, invincible: false, startup: 8, active: 4, recovery: 13, onHit: 2, onBlock: -2, animationState: 'kick-light', type: 'light-kick',
        hitboxes: [{ frameStart: 8, frameEnd: 11, x: 0.6, y: 0.5, z: 0, width: 0.7, height: 0.4, depth: 0.4, type: 'attack', damage: 38 }]
      },
      {
        id: 'punch-heavy', name: 'Solar Strike', input: 'HP', inputSequence: ['HP'], damage: 70, meterGain: 25, meterCost: 0, cancelable: true, invincible: false, startup: 11, active: 5, recovery: 18, onHit: 5, onBlock: -5, animationState: 'punch-heavy', type: 'heavy-punch',
        hitboxes: [{ frameStart: 11, frameEnd: 15, x: 0.7, y: 1.3, z: 0, width: 0.9, height: 0.5, depth: 0.5, type: 'attack', damage: 70, knockback: { x: 0.5, y: 0.15, z: 0 } }]
      },
      {
        id: 'kick-heavy', name: 'Nova Sweeper', input: 'HK', inputSequence: ['HK'], damage: 75, meterGain: 30, meterCost: 0, cancelable: false, invincible: false, startup: 12, active: 6, recovery: 22, onHit: 10, onBlock: -7, animationState: 'kick-heavy', type: 'heavy-kick',
        hitboxes: [{ frameStart: 12, frameEnd: 17, x: 0.8, y: 0.6, z: 0, width: 1.0, height: 0.4, depth: 0.4, type: 'attack', damage: 75, knockback: { x: 0.7, y: 0.45, z: 0 } }]
      },
      {
        id: 'special-rising', name: 'Phoenix Rise', input: '➡️⬇️↘️ + P', inputSequence: ['F', 'D', 'DF', 'P'], damage: 120, meterGain: 70, meterCost: 0, cancelable: false, invincible: true, startup: 5, active: 12, recovery: 35, onHit: 30, onBlock: -25, animationState: 'special-1', type: 'special',
        hitboxes: [{ frameStart: 5, frameEnd: 16, x: 0.4, y: 1.0, z: 0, width: 1.0, height: 2.5, depth: 1.0, type: 'attack', damage: 120, knockback: { x: 0.1, y: 0.7, z: 0 } }]
      },
      {
        id: 'super-nova-flare', name: 'Super Nova Flare', input: '⬇️↘️➡️⬇️↘️➡️ + K', inputSequence: ['D', 'DF', 'F', 'D', 'DF', 'F', 'K'], damage: 400, meterGain: 0, meterCost: 1000, cancelable: false, invincible: true, startup: 15, active: 30, recovery: 70, onHit: 150, onBlock: -60, animationState: 'super', type: 'super',
        hitboxes: [{ frameStart: 15, frameEnd: 45, x: 0.0, y: 0.0, z: 0, width: 6.0, height: 6.0, depth: 2.0, type: 'attack', damage: 400, knockback: { x: 0.5, y: 1.2, z: 0 } }]
      }
    ]
  }
]
