# Task: Implement DAG Viz v4.0 Camera Movement System

Follow this guide to implement the v4 design defined in `@src4/design.md`.

## Step 1: Implementation
1. **Multi-colored Cube**: Implement a 5x5x5 cube at `(0,0,0)` in `src4/App.ts` or `src4/Stage.ts`.
2. **CanvasTexture**: Use a `CanvasTexture` to paint different sides of the cube:
   - **Top Face**: Blue (`0x0000ff`)
   - **Other Faces**: Red or Green.
3. **Camera Utility**: Implement the `moveCamera` logic in `src4/App.ts` and ensure `isV4Implemented = true`.
4. **Logging**: Ensure `console.log` messages match the `expected-log` fields in the design.

## Step 2: Build & Test
Build the project:
```bash
bun run build_src4
```

Run all tests:
```bash
bun run test_src4
```

## Step 3: Verification
Open `src4/TEST.md` and verify that all 5 steps are logged with their respective timestamps, geometric logs, and screenshots of the green cube. **Every test must include a pixel check (via PixelUtil) verifying that the target cube is visible and correctly colored at the center of the frame.**

## Mandatory Constraints
- **Strict Isolation**: You MUST ONLY use and reference code within the `src4/` directory. Do not import or copy logic from `src/` or `src3/`. 
- **Self-Contained**: The only exception is the provided test library and pixel utilities already scaffolded into your `test/` folder.
- **No Global Leakage**: Ensure your implementation does not depend on global states defined in other versions of the app.