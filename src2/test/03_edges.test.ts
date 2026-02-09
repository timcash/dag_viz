import { TestLibrary, PORT } from './lib/TestLibrary';

async function run() {
    const lib = new TestLibrary();
    await lib.init();

    try {
        await lib.navigateTo(`http://localhost:${PORT}/?t=${Date.now()}`);
        await new Promise(r => setTimeout(r, 1000));

        lib.startStep("Phase 3: DAG Edge Rendering & Layout");
        
        const edges = await lib.page.evaluate(() => {
            const root = (window as any).app.rootPlane;
            const link = root.links[0];
            const n0 = root.nodes.get('node_0');
            const n1 = root.nodes.get('node_1');
            const n2 = root.nodes.get('node_2');
            
            return {
                linkCount: root.links.length,
                isCurved: link.line.geometry.attributes.position.count > 2,
                opacity: link.line.material.opacity,
                ranks: [n0.rank, n1.rank, n2.rank],
                xPositions: [n0.mesh.position.x, n1.mesh.position.x, n2.mesh.position.x]
            };
        });

        lib.log(`Links: ${edges.linkCount}, Curved: ${edges.isCurved}, Opacity: ${edges.opacity}`);
        lib.log(`Ranks: ${edges.ranks}, X: ${edges.xPositions}`);

        if (edges.linkCount === 2 && edges.isCurved && edges.xPositions[1] > edges.xPositions[0]) {
            await lib.finishStep('PASSED');
        } else {
            throw new Error(`Edge/Layout Failed: ${JSON.stringify(edges)}`);
        }

    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}

run();