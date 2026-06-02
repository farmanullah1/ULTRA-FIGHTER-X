# ⚔️ ULTRA FIGHTER X — 3D Cyberpunk Browser Fighting Game

**Ultra Fighter X** is a high-fidelity, WebGL-powered 3D fighting game that runs natively in your browser. Engineered with React 18, TypeScript, Tailwind CSS v4, and Babylon.js, the game delivers an immersive cyberpunk visual style alongside zero-latency responsive controls for both desktop and mobile layouts.

---

## 🚀 Key Features

### 1. Advanced 3D Graphics & Post-Processing
Ultra Fighter X supports real-time rendering scalability profiles (Low / Medium / Ultra) configuration in the Settings menu to balance performance and quality:
* **Ultra Quality Profile**:
  * Real-time soft volumetric directional shadows.
  * Screen-Space Ambient Occlusion (SSAO2) for realistic depth crevice shadows.
  * Cinematic Depth of Field (DoF) camera focus layering.
  * Ambient Bloom post-processing glowing trails and Chromatic Aberration filters.
  * 4x Multi-Sample Anti-Aliasing (MSAA) for clean vector edges.
  * 4K-ready PBR metal textures with procedural carbon specular noise details.
* **Medium Quality Profile**: Optimized shadow map sizes, 2x MSAA, and soft lighting for mid-range desktops and high-end phones.
* **Low Quality Profile**: Disables post-processing filters, shadows, and anti-aliasing to secure a locked 60 FPS on standard mobile viewports.

### 2. Mobile Multi-Touch Virtual Controls
* **Adaptive HUD layout**: Responsive interface that rescales elements according to device DPI and aspect ratios.
* **Virtual D-pad**: Circular drag-and-slide joystick zone on the left for directional movement, jumping, and crouching.
* **Virtual Action Arc**: Circular buttons on the right matching LP (Light Punch), HP (Heavy Punch), LK (Light Kick), HK (Heavy Kick), SP (Special), and EX (Super) inputs.
* **Multi-Touch Support**: Programmed with pointer touches utilizing `preventDefault()` blocks to prevent double-tap zooming while enabling simultaneous movement and button execution.
* **Haptic Vibration Feedback**: Integrates with the browser's `navigator.vibrate` API to pulse on-impact (light hit: 40ms, heavy hit: 75ms, super flash: double-pulse, KO finish: 300ms rumble).

### 3. Loop-based Background Attract Mode
* **Live Background Fight**: Picks two random fighters and stage themes on load, running CPU-vs-CPU battles behind the main menu titles.
* **Auto-Recycle Loop**: Attract Mode fights loop infinitely when rounds end, clearing automatically when players make their character selections.

### 4. Procedural Synthwave Audio Manager
* **Zero Audio Files Required**: Synthesizes all music and sound effects on-the-fly using the Web Audio API (Oscillators, BiquadFilters, WaveShapers, and White Noise buffers).
* **Futuristic Click Effects**: Immersive menu hover chirps and C-major chord select chimes.
* **Dynamic Sequencer**: Arranges distinct bassline progressions and hihat/kick beats for the menus (100 BPM) and fight stages (120–135 BPM).

---

## ⌨️ Controls & Key Mappings

### Player 1 (Left Keyboard Area)
* **Move Left / Right**: `A` / `D`
* **Jump / Crouch**: `W` / `S`
* **Light Punch (LP)**: `U`
* **Light Kick (LK)**: `I`
* **Heavy Punch (HP)**: `O`
* **Heavy Kick (HK)**: `P`
* **Special Attack (SP)**: `J`
* **Super Overdrive (EX)**: `K`
* **Defensive Guard (Block)**: `L`
* **Pause / Escape**: `ESC`

### Player 2 (Right Keyboard Area / NumPad)
* **Move Left / Right**: `ArrowLeft` / `ArrowRight`
* **Jump / Crouch**: `ArrowUp` / `ArrowDown`
* **Light Punch (LP)**: `Numpad 4`
* **Light Kick (LK)**: `Numpad 5`
* **Heavy Punch (HP)**: `Numpad 6`
* **Heavy Kick (HK)**: `Numpad 1`
* **Special Attack (SP)**: `Numpad 2`
* **Super Overdrive (EX)**: `Numpad 3`
* **Defensive Guard (Block)**: `Numpad 0`

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
* **Framer Motion**: powers UI menu transitions.
