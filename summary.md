# DAG Viz - System Summary & Roadmap

## Current State (v2.0 - Rollercoaster)

The project is a 3D visualization system for Directed Acyclic Graphs (DAGs) using Three.js and Bun.

### Core Architecture
- **Three.js Engine**: High-performance WebGL renderer with a dark neon aesthetic.
- **Hierarchical Layers**: Data is organized into `Layer` objects. Each `Layer` contains `Node` and `Edge` objects.
- **Recursive Depth**: Nodes can contain their own `subLayer`, allowing for an infinite "dive-in" hierarchy.
- **Camera Management**: Smooth transitions and "Ride Mode" navigation using Catmull-Rom splines.
- **Interaction System**: Raycasting-based interaction for hovering, clicking, and double-clicking.
- **Auto-Layout**: Nodes are automatically positioned based on their rank and connections.

### Key Visual Elements
- **Nodes**: Black boxes with white borders and labels. Hovering turns the border neon blue.
- **Edges**: Curved lines connecting nodes, with opacity based on weight.
- **Master Path (Magenta)**: A 3D tube showing the camera's journey through the DAG.
- **Hover Spline (Golden)**: A "laser" line from the camera to the hovered node.
- **Parent Connections**: Curved lines showing connections from a parent node to its sub-layer nodes.

---

## Required UI Features for 3D Layered DAG

To make the system fully functional and user-friendly, the following features are needed:

1.  **Breadcrumb Navigation**: A persistent HUD element showing the current path (e.g., `Root > Node A > SubNode B`). Allows clicking to jump back.
2.  **Node Inspector Panel**: A side panel that opens when a node is selected, showing metadata, descriptions, and performance metrics.
3.  **Search & Teleport**: A search bar to find nodes by ID or label, with a button to fly the camera directly to them.
4.  **Layout Toggles**: UI buttons to switch between different layout modes (e.g., Horizontal, Vertical, Radial).
5.  **Global Minimap**: A small 2D overlay showing the entire DAG structure and the user's current location/frustum.
6.  **Toolbox**: A floating menu for:
    - Adding new nodes/edges.
    - Deleting selected elements.
    - Toggling visual aids (grids, splines, labels).
    - Saving/Loading DAG states.
7.  **Legend**: A guide explaining the meaning of different colors, line thicknesses, and icons.

---

## Step-by-Step Test Plan (UI Interactions)

Follow these steps to verify the system's functionality:

### 1. Initial State & Rendering
- **Action**: Load the application.
- **User Sees**: A grid, the root layer with several nodes connected by blue lines, and a magenta path starting from the camera.
- **Verify**: `getSceneMetrics()` returns `currentLayerId: 'root'`.

### 2. Node Hovering
- **Action**: Move the mouse over a node.
- **User Sees**: The node border turns neon blue, its center glows, and a thin golden line connects the camera to the node.
- **Verify**: Cursor changes to `pointer`.

### 3. Deep Dive (Navigation)
- **Action**: Click on a node.
- **User Sees**: The camera smoothly flies towards the node, "entering" it. The current layer fades out, and a new sub-layer appears below with its own nodes.
- **Verify**: `currentLayerId` changes to the node's sub-layer ID.

### 4. Rollercoaster Ride (Progress)
- **Action**: Scroll the mouse wheel down.
- **User Sees**: The camera moves forward along the magenta path.
- **Verify**: `cameraManager.rideProgress` increases.

### 5. Return to Parent (Zoom Out)
- **Action**: Scroll the mouse wheel up at the start of a layer, or pan the camera far away from the current nodes.
- **User Sees**: The camera transitions back to the parent layer.
- **Verify**: `currentLayerId` returns to the parent layer ID.

### 6. Dynamic Node Creation
- **Action**: Double-click on the empty space of a layer.
- **User Sees**: A prompt asks for a label. After entering one, a new node appears at that location.
- **Verify**: Node count in `getSceneMetrics()` increases.

### 7. Manual Linking
- **Action**: Ctrl+Click one node, then Ctrl+Click another.
- **User Sees**: A new blue edge is drawn between the two nodes.
- **Verify**: Edge count in the current layer increases.

### 8. Panning & Exploration
- **Action**: Use W, A, S, D keys.
- **User Sees**: The camera pans across the current layer plane.
- **Verify**: Camera X and Z coordinates change.
