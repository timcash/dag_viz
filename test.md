# UI Interaction Test Plan

This document outlines all user interface interactions, the expected state of the system (Camera & Layers), and their testing status.

**Legend:**
- 🟢 **Automated**: Covered by `bun run smoke`.
- 🟡 **Manual**: verified manually, but not yet automated.
- 🔴 **Todo**: Not yet implemented or tested.

## 🖱️ Mouse Interactions

### 1. Hover Node (🟢 Automated)
*   **Action**: Move mouse cursor over a node in the current layer.
*   **Expected Camera**: Stationary.
*   **Expected Layers**:
    *   `Current Layer`: **VISIBLE**
    *   `Target Sublayer`: **VISIBLE** (Ghosted/Preview)
    *   `Other Sublayers`: **HIDDEN**
*   **Checks**:
    - [ ] Cursor changes to pointer.
    - [ ] Log: `[Interaction] Hover node...`.

### 2. Click Node / Drill Down (🟢 Automated)
*   **Action**: Click on a node to navigate into it.
*   **Expected Camera**:
    *   Moves to: `(Node.x, Sublayer.y + 20, Node.z + 20)`
    *   Looks at: `(Node.x, Sublayer.y, Node.z)` (Center of sublayer)
*   **Expected Layers**:
    *   `Parent Layer` (Previous): **HIDDEN** (Strict Visibility)
    *   `Target Sublayer` (New Current): **VISIBLE**
*   **Checks**:
    - [ ] Smooth transition animation.
    - [ ] Parent layer disappears specifically when transition starts/ends.

### 3. Scroll Wheel Zoom Out / Navigate Up (🟡 Manual)
*   **Action**: Scroll down (pull back) until camera distance > 60.
*   **Expected Camera**:
    *   Transitions back to previous camera position (Parent View).
*   **Expected Layers**:
    *   `Sublayer` (Old Current): **HIDDEN** (or becomes part of parent node)
    *   `Parent Layer` (Restored): **VISIBLE**
*   **Checks**:
    - [ ] Auto-navigation triggers automatically.
    - [ ] Context is restored (you see where you came from).

### 4. Double Click Background (🟡 Manual)
*   **Action**: Double click on empty space.
*   **Expected Layers**:
    *   `Current Layer`: **VISIBLE** (New node appears here)
*   **Checks**:
    - [ ] New node created at cursor projection.
    - [ ] Prompt appears for label.

### 5. Ctrl + Click (Linking) (🟡 Manual)
*   **Action**: Ctrl+Click Node A, then Ctrl+Click Node B.
*   **Expected State**:
    *   No camera movement.
    *   Edge added to `Current Layer`.
*   **Checks**:
    - [ ] Log: "Link source selected" -> "Linked A -> B".
    - [ ] Visual line connects the nodes.

## ⌨️ Keyboard Controls

### 6. WASD Panning (🟡 Manual)
*   **Action**: Press W/A/S/D keys.
*   **Expected Camera**:
    *   Moves on X/Z plane relative to camera view.
    *   Y remains constant (no vertical movement).
*   **Checks**:
    - [ ] Camera pans smoothly.

### 7. Delete Node (🟡 Manual)
*   **Action**: Hover node + Press Delete/Backspace.
*   **Expected Layers**:
    *   Node deleted from `Current Layer`.
    *   Connected edges removed.
*   **Checks**:
    - [ ] Node disappears.
    - [ ] Console log confirms deletion.

## 👁️ Visual Verification Principles

*   **Layer Stacking**: Sublayers must always be generated at `Y = ParentY - 20`. This ensures we are always "digging down".
*   **Strict Visibility**: At any given moment, the user should ONLY see:
    1.  The active layer they are creating/editing nodes in.
    2.  (Optional) The immediate sublayer of a hovered node for preview.
    *   **NEVER**: The parent layer above them (floating ceiling).
    *   **NEVER**: Sibling sublayers of non-hovered nodes.
