# Project Status Summary

## 📍 Location
`c:\Users\timca\code3\dag_viz`

## 🚀 Achievements

### 1. 3D Visualization Engine
- **Three.js Integration**: Completely replaced the 2D canvas with a high-performance 3D WebGL renderer.
- **Visual Style**: Adopted a premium "Dark Mode" aesthetic with neon blue accents and glowing nodes.
- **Modular Architecture**:
    - `App.js`: Main scene & loop.
    - `Layer.js`: Manages grouped nodes and edges.
    - `Node.js` / `Edge.js`: 3D Meshes.
    - `Layout.js`: Auto-ranking logic.
    - `CameraManager.js`: Smooth transitions.

### 2. Interaction & Navigation
- **Deep Zoom**: Click a node to "dive" into its sub-layer.
- **Preview**: Hover over a node to peek at its children.
- **Controls**: WASD panning + Mouse interaction.

### 3. Testing Infrastructure
- **Automated Smoke Tests**: `bun run smoke` launches a headless browser (Puppeteer) to verify:
    - Initial scene geometry.
    - Hover interactions.
    - Click navigation & Camera movement.
    - Layer visibility logic.
- **Robustness**: Tests automatically find a free port (avoiding `EADDRINUSE`) and kill conflicting processes.

---

## 📸 The Camera Issue & Fix

**Reported Issue**: "Clicking a node makes the camera look up" / Disorienting "Zoom Out" feel.

**Root Cause**:
The camera logic was positioning the camera *below* the target sublayer (Y=15) while looking *up* at it (Y=20). This created an "under the floor" perspective that felt like falling away or looking up, contrary to the expected "dive in" behavior.

**The Solution**:
1.  **Inverted Stacking**: Changed the layer generation logic so sublayers are created **below** the parent (Negative Y offset). This mimics "digging deeper" into the graph.
2.  **Over-the-Shoulder View**: strict logic in `focusNode` now positions the camera **above** the target sublayer, looking **down**.
    - *Before*: Camera Y < Target Y (Looking Up)
    - *After*: Camera Y > Target Y (Looking Down)
3.  **Strict Visibility**: To prevent visual confusion, we now aggressively hide all layers except the current one and the active sublayer. You no longer see "floors" above you.

## 🛠️ How to Run

- **Development**:
    ```bash
    bun run dev
    ```
    (Starts live server on Port 3000)

- **Verification**:
    ```bash
    bun run smoke
    ```
    (Runs automated tests on Port 3001)
