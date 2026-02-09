import { TestLibrary, PORT } from './lib/TestLibrary';

async function run() {
    const lib = new TestLibrary();
    await lib.init();

    try {
        await lib.navigateTo(`http://localhost:${PORT}/?t=${Date.now()}`);
        await new Promise(r => setTimeout(r, 1000));

        lib.startStep("Phase 7: Dynamic Node Hover Test");

        // 1. Programmatically add two specific nodes for the test
        const nodePositions = await lib.page.evaluate(() => {
            const app = (window as any).app;
            app.rootPlane.nodes.clear();
            app.rootPlane.links = [];
            app.rootPlane.group.clear();
            
            // Re-initialize plane so raycaster works if we click ground, 
            // but for mouse move we need the nodes.
            // Let's just make sure the nodes are added to the group.
            (app.rootPlane as any).initPlane(); 

            const nA = app.rootPlane.addNode('node_A', 'Node A');
            const nB = app.rootPlane.addNode('node_B', 'Node B');
            
            nA.mesh.position.set(-10, 0, 0);
            nB.mesh.position.set(10, 0, 0);

            // Force update world matrices so project() is accurate
            app.stage.scene.updateMatrixWorld(true);
            
            const project = (pos: THREE.Vector3) => {
                const p = pos.clone().project(app.stage.camera);
                return {
                    x: (p.x * 0.5 + 0.5) * window.innerWidth,
                    y: (p.y * -0.5 + 0.5) * window.innerHeight
                };
            };

            return {
                posA: project(nA.mesh.position),
                posB: project(nB.mesh.position)
            };
        });

        // 2. Hover Node A
        lib.log("Action: Hovering Node A");
        await lib.page.mouse.move(nodePositions.posA.x, nodePositions.posA.y);
        await new Promise(r => setTimeout(r, 200));
        await lib.snapshot("hover_node_a");
        
        let hoveredId = await lib.page.evaluate(() => (window as any).app.hoveredNodeId);
        if (hoveredId !== 'node_A') throw new Error(`Expected node_A to be hovered, got ${hoveredId}`);

        // 3. Hover Node B
        lib.log("Action: Hovering Node B");
        await lib.page.mouse.move(nodePositions.posB.x, nodePositions.posB.y);
        await new Promise(r => setTimeout(r, 200));
        await lib.snapshot("hover_node_b");
        
        hoveredId = await lib.page.evaluate(() => (window as any).app.hoveredNodeId);
        if (hoveredId !== 'node_B') throw new Error(`Expected node_B to be hovered, got ${hoveredId}`);

        await lib.finishStep('PASSED');

    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}

run();