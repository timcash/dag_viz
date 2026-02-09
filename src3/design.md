# DAG Viz v3.0 - Hover System Design

This version focuses exclusively on implementing and verifying a robust mouse hovering system for multiple 3D nodes.

## Goal
Establish a reliable hit-testing mechanism using Three.js Raycaster and verify the state transitions via automated Puppeteer tests and visual snapshots. Success is proven by the browser emitting specific logs upon UI interaction, which are then captured by Puppeteer.

## Minimal Component Structure

### 1. `App` (Bootstrap)
- Manages the `Stage` and `InputManager`.
- Exposes `hoveredNodeId: string | null` to the global `window.app` object.
- Provides a clean interface for adding test nodes.

### 2. `Stage` (Environment)
- Minimal Three.js setup (Camera at `0, 20, 50`, Looking at `0, 0, 0`).
- Basic lighting to ensure nodes are visible in screenshots.

### 3. `InputManager` (Interactions & Logging)
- Implements Raycaster logic.
- **Critical Requirement**: Must execute `console.log` messages when hover states change. These logs serve as the primary proof of functional UI interaction.

### 4. `Node` (Interactable)
- Simple `BoxGeometry` mesh.
- Visual feedback on hover: color change or emissive intensity increase.
- Stores its `id` in `mesh.userData.id`.

## Testing Strategy

Using the established `TestLibrary`, we will execute a 5-step hover verification sequence. For every step, we check the **Browser Console Logs** captured by Puppeteer to verify the interaction was processed by the UI.

### 1. `src3/test/01_initial_null.test.ts`
- **Goal**: Confirm no nodes are hovered by default.
- **Camera Position**: `(0, 20, 50)`
- **LookAt Point**: `(0, 0, 0)`
- **expected-log**: `[v3-app] System ready. Current hover: null`
- **test-condition-1**: Execute `window.app.hoveredNodeId` and assert result is `null`.
- **test-condition-2**: Verify the browser emitted the expected-log during initialization.
- **test-condition-3**: Capture `initial_state` snapshot.

### 2. `src3/test/02_hover_node_a.test.ts`
- **Goal**: Confirm Node A highlights correctly.
- **Camera Position**: `(0, 20, 50)`
- **LookAt Point**: `(0, 0, 0)`
- **expected-log**: `[v3-app] Hover change: node_A`
- **test-condition-1**: Use `page.mouse.move` to the projected screen coordinates of Node A and wait 200ms.
- **test-condition-2**: Verify the browser emitted the expected-log as a result of the mouse movement.
- **test-condition-3**: Assert `window.app.hoveredNodeId === 'node_A'`.
- **test-condition-4**: Capture `hover_node_a` snapshot.

### 3. `src3/test/03_hover_node_b.test.ts`
- **Goal**: Confirm focus shifts to Node B.
- **Camera Position**: `(0, 20, 50)`
- **LookAt Point**: `(0, 0, 0)`
- **expected-log**: `[v3-app] Hover change: node_B`
- **test-condition-1**: Use `page.mouse.move` to move directly to Node B screen coordinates and wait 200ms.
- **test-condition-2**: Verify the browser emitted the expected-log showing the transition.
- **test-condition-3**: Assert `window.app.hoveredNodeId === 'node_B'`.
- **test-condition-4**: Capture `hover_node_b` snapshot.

### 4. `src3/test/04_hover_exit.test.ts`
- **Goal**: Confirm hover clears when moving to empty space.
- **Camera Position**: `(0, 20, 50)`
- **LookAt Point**: `(0, 0, 0)`
- **expected-log**: `[v3-app] Hover change: null`
- **test-condition-1**: Use `page.mouse.move` to the top-left corner `(10, 10)`.
- **test-condition-2**: Verify the browser emitted the expected-log upon leaving the node.
- **test-condition-3**: Assert `window.app.hoveredNodeId === null`.
- **test-condition-4**: Capture `hover_exit` snapshot.

### 5. `src3/test/05_reentry.test.ts`
- **Goal**: Confirm Node A can be re-hovered after an exit.
- **Camera Position**: `(0, 20, 50)`
- **LookAt Point**: `(0, 0, 0)`
- **expected-log**: `[v3-app] Hover change: node_A`
- **test-condition-1**: Use `page.mouse.move` to return to `node_A` screen coordinates.
- **test-condition-2**: Verify the browser emitted the re-entry log.
- **test-condition-3**: Assert `window.app.hoveredNodeId === 'node_A'`.
- **test-condition-4**: Capture `hover_reentry_a` snapshot.

## Implementation Requirements

- **Scene**: A simple dark grid with `AmbientLight` and `DirectionalLight`.
- **Nodes**: Two cubes (`node_A` at X=-10, `node_B` at X=10).
- **Library Integration**: All tests must call `lib.startStep()` with the specific Phase name and `lib.finishStep('PASSED')` to ensure the markdown report is correctly generated.

