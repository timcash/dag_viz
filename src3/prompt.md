# Task: Implement DAG Viz v3.0 Hover System

Follow this guide to implement the v3 design defined in `@src3/design.md`. You will work in a tight loop: implement a component/test, build, run, and verify the report.

## Step 1: Core Scaffolding
Implement the following classes in `src3/` as defined in the design:
1. **`src3/Stage.ts`**: Minimal Three.js setup (Camera at `0, 20, 50`, Looking at `0, 0, 0`).
2. **`src3/Node.ts`**: Box geometry with grey (`0x444444`) default and neon blue (`0x0066ff`) hover emissive.
3. **`src3/InputManager.ts`**: Raycaster that maps mouse coordinates to node hover states. 
   - **IMPORTANT**: This class must `console.log` the exact messages defined in `@src3/design.md` (e.g., `[v3-app] Interaction: Hover ENTER node_A`) when interactions occur.
4. **`src3/App.ts`**: Bootstrap that adds `node_A` (X=-10) and `node_B` (X=10).

## Step 2: Configuration
Update `package.json` to support v3:
- `"build_v3": "bun build ./src3/App.ts --outdir ./dist --bundle"`
- `"test_v3": "bun run src/test/run_all.ts"` (Update the `run_all.ts` if needed to include src3 tests or create a v3 runner).
- `"dev_v3": "bun build ./src3/App.ts --outdir ./dist --watch & bun run server.ts"`

## Step 3: Iterative Implementation Loop
For each test case (1 through 5) in `@src3/design.md`:

1. **Implement**: Create the specific test file in `src3/test/` (e.g., `01_initial_null.test.ts`).
2. **Standard Library**: Always use `import { TestLibrary, PORT } from '../../src/test/lib/TestLibrary';`. This library automatically captures browser console logs.
3. **Build & Execute**:
   ```bash
   bun run build_v3 && bun run <path_to_test_file>
   ```
4. **Verify**: Check `src/TEST.md` to ensure the new section is appended, the `expected-log` (captured from the browser) is present in the `Logs` block, and the snapshots show the correct visual state.
5. **Repeat**: Move to the next test case.

## Step 4: Final Integration
1. Implement `src3/test/run_all.ts` to execute the full sequence.
2. Run `bun run test_v3`.
3. Confirm `src/TEST.md` contains all 5 phases with their respective snapshots.

### Mandatory Rules
- **No Direct State Manipulation**: You MUST use `page.mouse.move(x, y)` to trigger hovers.
- **Incremental Reporting**: Do not wipe `TEST.md`; use the `TestLibrary` to update it section-by-section.
- **Cleanup**: Ensure the server and browser are killed after each test run.
