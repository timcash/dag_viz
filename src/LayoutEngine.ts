import { GraphPlane } from './GraphPlane';

/**
 * LayoutEngine: Handles automatic node ranking and placement.
 * (Step 13)
 */
export class LayoutEngine {
    static apply(plane: GraphPlane): void {
        // Reset ranks
        plane.nodes.forEach(node => node.rank = 0);

        // Simple iterative rank assignment
        let changed = true;
        while (changed) {
            changed = false;
            plane.links.forEach(link => {
                if (link.to.rank <= link.from.rank) {
                    link.to.rank = link.from.rank + 1;
                    changed = true;
                }
            });
        }

        // Apply positions based on rank
        const rankCounts: Map<number, number> = new Map();
        plane.nodes.forEach(node => {
            const count = rankCounts.get(node.rank) || 0;
            node.mesh.position.x = node.rank * 10;
            node.mesh.position.z = count * 5;
            rankCounts.set(node.rank, count + 1);
        });

        // Update links
        plane.links.forEach(link => link.update());

        // Recursive for sub-layers
        plane.nodes.forEach(node => {
            if (node.subPlane) {
                LayoutEngine.apply(node.subPlane);
            }
        });
    }
}
