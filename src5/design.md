# DAG Viz v5.0 - Single-Layer DAG Rendering

This version focuses on the structural rendering of a complex Directed Acyclic Graph (DAG) on a single 3D plane.

## Goal
Implement a robust rendering system for a DAG with 7 ranks, where each rank contains 2 to 5 nodes. All nodes must be connected via edges, and the layout must be strictly left-to-right based on rank.

## Minimal Component Structure

### 1. `App` (Bootstrap)
- Manages `Stage`.
- Responsible for generating the DAG structure (7 ranks, 2-5 nodes/rank).
- Connects nodes with `Link` objects.
- Exposes `isV5Implemented: boolean` for test verification.

### 2. `Stage` (Environment)
- Fixed camera position: `(30, 60, 30)` looking at `(30, 0, 0)`.
- Static scene with no user-controlled camera or mouse interaction.

### 3. `Node`
- 2x2x2 Grey cubes.
- Positioned at `x = rank * 10`, `z = index_in_rank * 5`.

### 4. `Link`
- Visual lines/curves connecting nodes.
- Must render from an output of a node in rank `N` to an input of a node in rank `N+1`.

## Testing Strategy

All tests use the `TestLibrary` to capture logs and snapshots. Success is verified through state counts and pixel verification of the grid.

### 1. `src5/test/01_step.test.ts` (Basic Ranks)
- **Goal**: Verify the first 2 ranks are rendered.
- **Verification**: Assert node count is between 4 and 10.
- **expected-log**: `[v3-app] Ranks 0-1 rendered successfully`

### 2. `src5/test/02_step.test.ts` (Mid-Sized DAG)
- **Goal**: Verify 4 ranks are rendered.
- **Verification**: Assert node count is between 8 and 20.
- **expected-log**: `[v3-app] Ranks 0-3 rendered successfully`

### 3. `src5/test/03_step.test.ts` (Edge Rendering)
- **Goal**: Verify edges are present between nodes.
- **test-condition-1**: Assert link count is `> 0`.
- **Pixel Check**: Verify pixels between nodes show line colors.
- **expected-log**: `[v3-app] Edge rendering verified`

### 4. `src5/test/04_step.test.ts` (Full 7-Rank Structure)
- **Goal**: Verify all 7 ranks are generated.
- **Verification**: Assert node count is between 14 and 35.
- **expected-log**: `[v3-app] Full 7-rank DAG initialized`

### 5. `src5/test/05_step.test.ts` (Visual Layout Proof)
- **Goal**: Final visual check of the entire plane.
- **Verification**: Assert all nodes follow `x = rank * 10`.
- **Snapshot**: `full_dag_layout`.
- **expected-log**: `[v3-app] Visual layout verification complete`

### 6. `src5/test/06_step.test.ts` (Sub-layer Hookup)
- **Goal**: Verify a specific node (e.g., node 7) can hold a sub-layer reference.
- **test-condition-1**: Identify node with ID `node_7`.
- **test-condition-2**: Assert `node_7.subLayer` is initialized as a new `Plane` or `Group`.
- **expected-log**: `[v3-app] Node 7 sub-layer initialized`

### 7. `src5/test/07_step.test.ts` (Sub-node Rendering)
- **Goal**: Verify nodes can render inside the sub-layer.
- **test-condition-1**: Add 3 nodes to the sub-layer of `node_7`.
- **Verification**: Assert `node_7.subLayer.nodes.size === 3`.
- **expected-log**: `[v3-app] Sub-nodes rendered in Node 7`

### 8. `src5/test/08_step.test.ts` (Sub-layer Spatial Offset)
- **Goal**: Confirm sub-layer is positioned below the parent.
- **Verification**: Assert `node_7.subLayer.group.position.y` is exactly `-20` relative to `node_7`.
- **expected-log**: `[v3-app] Sub-layer vertical offset verified`

### 9. `src5/test/09_step.test.ts` (Vertical Inter-Layer Links - VILLs)
- **Goal**: Verify visual "threads" connecting the parent node to its children.
- **Terminology**: **VILL** (Vertical Inter-Layer Link) - A blue line or curve originating from the bottom of a parent node and terminating at the top of its sub-nodes.
- **test-condition-1**: Identify VILL objects in the scene.
- **Verification**: Assert VILL count matches the number of sub-nodes in `node_7`.
- **expected-log**: `[v3-app] VILLs (Vertical Inter-Layer Links) rendered successfully`

### 10. `src5/test/10_step.test.ts` (Hierarchical Visual Proof)
- **Goal**: Capture a snapshot showing the full vertical stack with VILLs.
- **Camera Position**: `(60, 40, 80)` (Adjusted to see depth).
- **LookAt Point**: `(30, -10, 0)`
- **Verification**: Visual confirmation of parent plane, child plane, and blue VILLs connecting them.
- **Snapshot**: `hierarchical_vill_layout`.
- **expected-log**: `[v3-app] Hierarchical VILL layout verification complete`

### 11. `src5/test/11_step.test.ts` (Multi-Sublayer Initialization)
- **Goal**: Verify multiple parent nodes can independently host sub-layers.
- **Terminology**: **DSP** (Discrete Subplane) - An isolated 3D plane belonging to a specific parent node.
- **test-condition-1**: Initialize sub-layer for `node_12`.
- **Verification**: Assert `node_7` and `node_12` both have active `subLayer` (DSP) references.
- **expected-log**: `[v3-app] Discrete Subplanes (DSPs) initialized for multiple nodes`

### 12. `src5/test/12_step.test.ts` (DSP Spatial Separation)
- **Goal**: Ensure sub-layers do not collide or overlap.
- **Verification**: Assert `node_12.subLayer` world position is offset from `node_7.subLayer` based on their parent nodes' `(x, z)` coordinates.
- **expected-log**: `[v3-app] DSP spatial separation verified`

### 13. `src5/test/13_step.test.ts` (VILL Color Differentiation)
- **Goal**: Verify unique color coding for different parent-child hierarchies.
- **test-condition-1**: Assign **Yellow** color to `node_12` VILLs.
- **Verification**: Assert `node_7` VILLs are **Blue** and `node_12` VILLs are **Yellow** via `page.evaluate`.
- **expected-log**: `[v3-app] VILL color differentiation complete`

### 14. `src5/test/14_step.test.ts` (Hierarchical Density)
- **Goal**: Verify rendering of multiple concurrent sub-nodes.
- **Verification**: Assert total node count across root and both DSPs is correct (e.g., Root + Node7_Subs + Node12_Subs).
- **expected-log**: `[v3-app] Hierarchical node density verified`

### 15. `src5/test/15_step.test.ts` (Final Multi-Layer Orchestration Proof)
- **Goal**: Final bird's-eye view of the complex multi-layer hierarchy.
- **Camera Position**: `(100, 60, 100)`
- **LookAt Point**: `(30, -10, 30)`
- **Snapshot**: `multi_dsp_orchestration_layout`.
- **expected-log**: `[v3-app] Multi-layer VILL orchestration verified successfully`

### 16. `src5/test/16_step.test.ts` (Massive DSP Generation)
- **Goal**: Verify a high-density sub-layer for a third parent node (e.g., `node_18`).
- **test-condition-1**: Initialize a DSP for `node_18` with 10 sub-nodes.
- **Verification**: Assert `node_18.subLayer.nodes.size === 10`.
- **expected-log**: `[v3-app] Massive 10-node DSP initialized for node 18`

### 17. `src5/test/17_step.test.ts` (Global DSP Spatial Map)
- **Goal**: Verify no collisions across all 3 active DSPs.
- **test-condition-1**: Calculate bounding boxes for DSPs of `node_7`, `node_12`, and `node_18`.
- **Verification**: Assert that no two DSP bounding boxes overlap in 3D space.
- **expected-log**: `[v3-app] Global DSP spatial separation confirmed`

### 18. `src5/test/18_step.test.ts` (VILL Thread Density)
- **Goal**: Verify the rendering of a high volume of vertical links.
- **test-condition-1**: Count all active VILLs across the scene.
- **Verification**: Assert VILL count is correct (e.g., 3 from node_7 + 2 from node_12 + 10 from node_18 = 15 total).
- **expected-log**: `[v3-app] High-density VILL threads verified`

### 19. `src5/test/19_step.test.ts` (VILL Color Complexity)
- **Goal**: Verify a third color for the massive DSP links.
- **test-condition-1**: Assign **Magenta** to `node_18` VILLs.
- **Verification**: Assert scene contains Blue, Yellow, and Magenta VILLs.
- **expected-log**: `[v3-app] Tri-color VILL orchestration complete`

### 20. `src5/test/20_step.test.ts` (Macro-Hierarchy Visual Proof)
- **Goal**: Zoomed-out snapshot of the entire multi-DAG ecosystem.
- **Camera Position**: `(150, 100, 150)`
- **LookAt Point**: `(50, -10, 50)`
- **Snapshot**: `macro_hierarchy_final`.
- **expected-log**: `[v3-app] Macro-hierarchy visual verification successful`




