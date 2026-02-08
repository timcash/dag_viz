
export class Layout {
    static compute(nodes, edges) {
        // Simple rank-based layout for 3D
        // X = Rank, Z = Index in Rank
        const ranks = new Map(); // id -> rank
        const nodesList = Array.from(nodes.values());

        // precise topo sort / rank assignment
        nodesList.forEach(n => ranks.set(n.id, 0));

        let changed = true;
        while (changed) {
            changed = false;
            edges.forEach(e => {
                const rFrom = ranks.get(e.from);
                const rTo = ranks.get(e.to);
                if (rTo <= rFrom) {
                    ranks.set(e.to, rFrom + 1);
                    changed = true;
                }
            });
        }

        // Group by rank to determine Z
        const rankGroups = new Map();
        nodesList.forEach(n => {
            const r = ranks.get(n.id);
            if (!rankGroups.has(r)) rankGroups.set(r, []);
            rankGroups.get(r).push(n);
        });

        // Assign X, Z
        nodesList.forEach(n => {
            const r = ranks.get(n.id);
            const group = rankGroups.get(r);
            const index = group.indexOf(n);
            const z = index - (group.length - 1) / 2; // Center Z around 0

            n.x = r * 5; // Spacing X
            n.z = z * 3; // Spacing Z
        });
    }
}
