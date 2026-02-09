# Task: Implement DAG Viz v5.0 Single-Layer DAG Rendering

Follow this guide to implement the v5 design defined in `@src5/design.md`.

## Step 1: Implementation
1. **Camera Setup**: Set `src5/Stage.ts` camera to `(30, 60, 30)` looking at `(30, 0, 0)`.
2. **Node & Link**: Implement simple Cube nodes and Edge lines in `src5/`.
3. **DAG Generator**: In `src5/App.ts`, create a loop that builds 7 ranks.
   - For each rank `i` (0 to 6), create 2-5 nodes.
   - Connect each node in rank `i` to at least one node in rank `i+1`.
4. **Sub-layer System (DSPs)**: Implement a mechanism for nodes to contain isolated nested groups called **Discrete Subplanes (DSPs)**.
   - For `node_7`, initialize a DSP at `Y = -20`.
   - For `node_12`, initialize a second DSP at `Y = -20`.
   - For `node_18`, initialize a massive 10-node DSP at `Y = -20`.
   - **Crucial**: Each DSP must be positioned directly under its parent's world position to prevent collisions between sub-layers.
5. **VILLs (Vertical Inter-Layer Links)**: Implement visual threads between layers.
   - Parent `node_7` -> `node_7_subs` using **Blue** VILLs.
   - Parent `node_12` -> `node_12_subs` using **Yellow** VILLs.
   - Parent `node_18` -> `node_18_subs` using **Magenta** VILLs.
6. **Validation**: Set `isV5Implemented = true`.
7. **Logging**: Ensure `console.log` messages match the `expected-log` fields in the design.

## Step 2: Build & Test
Build:
```bash
bun run build_src5
```

Test:
- You must create 20 test files (`01_step.test.ts` through `20_step.test.ts`) in `src5/test/`.
- Update `src5/test/run_all.ts` to execute all 20 steps.
- Run: `bun run test_src5`.

## Step 3: Verification
Open `src/TEST.md` and verify:
- Steps 1-5: Root DAG construction.
- Steps 6-10: First hierarchical stack (`node_7` + Blue VILLs).
- Steps 11-15: Multi-layer orchestration (`node_12` + Yellow VILLs).
- Steps 16-20: High-density spatial mapping (`node_18` + Magenta VILLs), ensuring no spatial overlap between the three sub-planes.

## Mandatory Constraints
- **Strict Isolation**: You MUST ONLY use and reference code within the `src5/` directory.
- **No Interaction**: No mouse or camera controls are needed; the system should render the full graph immediately.
