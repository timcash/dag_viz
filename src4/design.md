# DAG Viz v4.0 - Camera Movement Design

This version focuses on implementing and verifying a precise camera system capable of different perspectives and smooth interpolations.

## Goal
Implement a `moveCamera` utility that supports static positioning and alpha-based interpolation while maintaining focus on a target. Success is proven by the browser emitting specific logs and the green cube being visible in snapshots.

## Minimal Component Structure

### 1. `App` (Bootstrap)
- Manages `Stage`.
- Exposes `moveCamera(pos, target, alpha)` method.
- Exposes `isV4Implemented: boolean` for test verification.

### 2. `Stage` (Environment)
- Minimal Three.js setup.
- **Requirement**: Contains a single 5x5x5 cube at `(0, 0, 0)`. 
- **Requirement**: The cube must use a **CanvasTexture** to apply different colors to its faces. 
    - **Top Face**: Blue (`0x0000ff`)
    - **Side Faces**: Red (`0xff0000`) or Green (`0x00ff00`)
- This ensures that as the camera moves, the sampled color at screen center changes according to the visible face.

## Testing Strategy

All tests use the `TestLibrary` to capture logs and snapshots. Success is verified through both state assertion (camera coordinates) and pixel verification (confirming the correct face color is visible at screen center).

### 1. `src4/test/01_step.test.ts` (Top-Down)
- **Goal**: Verify Top-Down perspective.
- **Camera Position**: `(0, 50, 0)`
- **LookAt Point**: `(0, 0, 0)`
- **expected-log**: `[v4-app] Camera moved to Top-Down: (0, 50, 0)`
- **Pixel Check**: Verify screen center `(640, 360)` is **Blue** (Top face).

### 2. `src4/test/02_step.test.ts` (Over-Shoulder)
- **Goal**: Verify Over-the-Shoulder perspective.
- **Camera Position**: `(0, 20, 50)`
- **LookAt Point**: `(0, 0, 0)`
- **expected-log**: `[v4-app] Camera moved to Over-Shoulder: (0, 20, 50)`
- **Pixel Check**: Verify screen center `(640, 360)` is **Red/Greenish** (depending on front/back face color).

### 3. `src4/test/03_step.test.ts` (Interpolate Start)
- **Goal**: Verify start of interpolation (alpha=0).
- **Start Position**: `(50, 50, 50)`
- **End Position**: `(-50, 20, 0)`
- **test-condition-1**: Call `moveCamera` with `alpha=0`.
- **Verify**: Camera is at `(50, 50, 50)`.
- **expected-log**: `[v4-app] Interpolation alpha 0.0: (50, 50, 50)`
- **Pixel Check**: Verify screen center `(640, 360)` shows visible cube.

### 4. `src4/test/04_step.test.ts` (Interpolate Mid)
- **Goal**: Verify midpoint of interpolation (alpha=0.5).
- **test-condition-1**: Call `moveCamera` with `alpha=0.5`.
- **Verify**: Camera is at the lerped midpoint `(0, 35, 25)`.
- **expected-log**: `[v4-app] Interpolation alpha 0.5: (0, 35, 25)`
- **Pixel Check**: Verify screen center `(640, 360)` shows visible cube.

### 5. `src4/test/05_step.test.ts` (Interpolate End)
- **Goal**: Verify end of interpolation (alpha=1.0).
- **test-condition-1**: Call `moveCamera` with `alpha=1.0`.
- **Verify**: Camera is at `(-50, 20, 0)`.
- **expected-log**: `[v4-app] Interpolation alpha 1.0: (-50, 20, 0)`
- **Pixel Check**: Verify screen center `(640, 360)` is **Red** (Side face).