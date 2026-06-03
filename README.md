# ⚔️ ULTRA FIGHTER X — 3D Cyberpunk Browser Fighting Game

**Ultra Fighter X** is a high-fidelity, WebGL-powered 3D fighting game that runs natively in your browser. Engineered with React 18, TypeScript, Tailwind CSS v4, and Babylon.js, the game delivers an immersive cyberpunk visual style alongside zero-latency responsive controls for both desktop and mobile layouts.

---

## 🚀 Key Features

### 1. 3D Character Selection Screen (CSS)
* **Real-time 3D Previews**: Interactive character select screen showing the selected 3D fighter models bobbing and slowly rotating.
* **Selection Effects**: Confirming a character selection triggers their signature victory stance, camera shake, sound chimes, and neon particle bursts.

### 2. Interactive Environments & Weather Particles
* **Weather Systems**: Continuous procedural weather particle loops without loading heavy assets:
  * **Neon Tokyo (Cyber City)**: 120 fast-falling light-blue rain lines with sideways wind drift, plus random double-flash lightning storm flashes that spike ambient lighting and play a thunder rumble.
  * **Volcano Forge (Volcano)**: 80 slow-falling red-orange ash particles swaying via custom sine waves.
  * **Neon Dojo**: 60 pink sakura petals gently floating down, rotating, and drifting.
* **Destructible Barriers**: Neon glass boundaries at the left and right stage borders that shatter on heavy impact, playing procedural glass shattering audio and spawning high-speed glowing shards.
* **Cheering Spectators**: Cylindrical background crowds bobbing and waving.

### 3. Advanced Fighting & Movement Animations
* **Dashing**: Double-tap forward (`W`) or backward (`S`) to execute quick dashes (torso lean, bent knees, tucked arms).
* **Dodge Rolling**: Pressing Special-2 (`J` + direction) triggers a complete 360-degree roll rotation along the horizontal movement axis while dipping Y height.
* **Knockdowns & Getups**: Launched players falling onto the ground lie flat on their back (90° Z rotation) and smoothly stand up when their getup timer expires.
* **Victory / Defeat Poses**: Custom procedural poses for match endings.

### 4. High-Graphics Post-Processing
* **Ultra Quality Profile**: Enables Bloom, Screen-Space Ambient Occlusion (SSAO2), Cinematic Depth of Field (DoF), Chromatic Aberration, 4x MSAA anti-aliasing, and 4K-ready PBR metal textures with carbon noise.
* **Medium Quality Profile**: Balanced shadow map resolution and 2x MSAA for mid-range desktops.
* **Low Quality Profile**: Disables post-processing and shadows to lock 60 FPS on mobile browsers.

### 5. Mobile Multi-Touch Virtual Controls
* **Joystick / Button Overlay**: Drag-and-slide virtual D-pad on the left; LP, HP, SP, LK, HK, EX action buttons on the right.
* **Haptic Feedback**: Screen shakes and device vibrations triggered on hits (light hits: 40ms, heavy hits: 75ms, super flash: double-pulse, KO finish: 300ms rumble).

### 6. Procedural Synthwave Audio Manager
* **Zero Audio Files Required**: Synthesizes all music tracks and sound effects on-the-fly using the Web Audio API.
* **Vocal Grunts & Shouts**: Synthesized grunts for light hits, shouts for heavy/special hits, and chime arpeggios for EX/Super activations.

---

## ⌨️ Controls & Key Mappings

### Player 1 (Left Keyboard Area)
* **Move Forward / Backward**: `W` / `S`
* **Sidestep Left / Right (Z-Axis)**: `A` / `D` (Double-tap to sidewalk)
* **Light Punch (LP)**: `B`
* **Light Kick (LK)**: `N`
* **Heavy Punch (HP)**: `M`
* **Heavy Kick (HK)**: `P`
* **Special Attack (SP)**: `J`
* **Super / Rage Art (EX)**: `L`
* **Defensive Guard (Block)**: `K`
* **Short Hop (Jump)**: `Space`

### Player 2 (Right Keyboard Area / NumPad)
* **Move Forward / Backward**: `ArrowUp` / `ArrowDown`
* **Sidestep Left / Right (Z-Axis)**: `ArrowLeft` / `ArrowRight` (Double-tap to sidewalk)
* **Light Punch (LP)**: `Numpad 4`
* **Light Kick (LK)**: `Numpad 5`
* **Heavy Punch (HP)**: `Numpad 6`
* **Heavy Kick (HK)**: `Numpad 9`
* **Special Attack (SP)**: `Numpad 1`
* **Super / Rage Art (EX)**: `Numpad 3`
* **Defensive Guard (Block)**: `Numpad 2`
* **Short Hop (Jump)**: `Numpad 0`

---

## 🛠️ Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Local Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Build Production Bundle**:
   ```bash
   npm run build
   ```
   Optimizes assets and generates compilation outputs in the `dist` directory.

---

## 📁 Technical Architecture
* **React 18 + Vite**: Handles hot modular state rendering.
* **Babylon.js**: Renders WebGL scene nodes, lighting, shadows, cameras, and procedural meshes.
* **Zustand (Immer)**: Manages global match state, settings, combos, and volume stores.
* **Framer Motion**: Powers UI menu transitions.
