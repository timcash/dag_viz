import { Node } from './Node';

export class Layout {
    static compute(nodes: Map<string, Node>, edges: { from: string, to: string }[]): void {
        const ranks = new Map<string, number>();
        const nodesList = Array.from(nodes.values());

        nodesList.forEach(n => ranks.set(n.id, 0));

        let changed = true;
        while (changed) {
            changed = false;
            edges.forEach(e => {
                const rFrom = ranks.get(e.from) ?? 0;
                const rTo = ranks.get(e.to) ?? 0;
                if (rTo <= rFrom) {
                    ranks.set(e.to, rFrom + 1);
                    changed = true;
                }
            });
        }

        const rankGroups = new Map<number, Node[]>();
        nodesList.forEach(n => {
            const r = ranks.get(n.id) ?? 0;
            if (!rankGroups.has(r)) rankGroups.set(r, []);
            rankGroups.get(r)!.push(n);
        });

        nodesList.forEach(n => {
            const r = ranks.get(n.id) ?? 0;
            const group = rankGroups.get(r)!;
            const index = group.indexOf(n);
            const z = index - (group.length - 1) / 2;

            n.x = r * 5;
            n.z = z * 3;
        });
    }
}
