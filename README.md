# 3D DAG Visualization

A 3D visualization of a Directed Acyclic Graph (DAG) using Three.js. This application visualizes hierarchical graphs where nodes can contain nested sub-graphs (layers), creating a "multi-layer chess" experience.

## 🛠️ Development Workflow

**Recommended Step-by-Step Process:**

1.  **Make Good Logs**: Ensure your changes emit clear console logs (`[Interaction]`, `[Navigation]`) to track state changes.
2.  **Check the Geometry**: Verify that positions, camera angles, and visibility states match your expectations mathematically.
3.  **Prove with Smoke Test**: Run the automated smoke test to verify interactions and generate a report with screenshots.

```bash
bun run smoke
```

Check `SMOKE.md` after running to see the **Proof of Work** (Screenshots + Logs).

## Features

-   **3D Environment**: Nodes are represented as 3D boxes with text labels, effectively arranged in layers.
-   **Nested Layers**: Infinite nesting of sub-graphs. Clicking a node "zooms in" to its internal graph.
-   **Adaptive Visibility**: Only the current layer and the hovered node's immediate sub-layer are visible, reducing clutter.
-   **Auto-Layout**: Nodes are automatically positioned based on their rank (dependencies) and order.
-   **Interactive Editing**: Add nodes, link them, and delete them dynamically.

## Controls

### Navigation
-   **WASD**: Pan the camera around the current layer (like a map).
-   **Scroll Up / Back**: Zoom out to the parent layer.
-   **Click Node**: Zoom in to the node's sub-layer (Over-the-shoulder view).
-   **Hover Node**: Preview the node's sub-layer (Blue Glow).

### Editing
-   **Double Click**: Add a new node at the cursor position (space).
-   **Ctrl + Click**: Link two nodes. Click source, then click target.
-   **Delete / Backspace**: Delete the hovered node.

## Setup

1.  **Install Dependencies**:
    ```bash
    bun install
    ```
2.  **Run Server**:
    ```bash
    bun run server.ts
    ```
3.  **Open Browser**:
    Visit `http://localhost:3000`

## Structure

-   `src/App.js`: Main application logic, event handling, and rendering loop.
-   `src/Layer.js`: Manages a graph layer (nodes, edges, raycast plane).
-   `src/Node.js`: 3D Node object with mesh, label, and sub-layer reference.
-   `src/CameraManager.js`: Handles camera transitions, orbit controls, and WASD panning.
-   `src/Layout.js`: 3D force/rank-based layout algorithm.
