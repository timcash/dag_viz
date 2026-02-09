import { TestLibrary, PORT } from './lib/TestLibrary';

async function run() {
    const lib = new TestLibrary();
    await lib.init();

    try {
        await lib.navigateTo(`http://localhost:${PORT}/?t=${Date.now()}`);
        await new Promise(r => setTimeout(r, 1000));

        lib.startStep("Phase 2: Node & Layer Architecture");
        await lib.logGeometry();

        const arch = await lib.page.evaluate(() => {
            const app = (window as any).app;
            const root = app.rootPlane;
            return {
                nodeCount: root.nodes.size,
                hasGround: root.group.children.some((c: any) => c.geometry && c.geometry.type === 'PlaneGeometry'),
                hasLabels: Array.from(root.nodes.values()).every((n: any) => n.mesh.children.some((c: any) => c.material && c.material.map))
            };
        });

        lib.log(`Nodes: ${arch.nodeCount}, Ground: ${arch.hasGround}, Labels: ${arch.hasLabels}`);
        
        if (arch.nodeCount === 3 && arch.hasGround && arch.hasLabels) {
            await lib.finishStep('PASSED');
        } else {
            throw new Error(`Architecture Failed: Nodes=${arch.nodeCount}, Ground=${arch.hasGround}, Labels=${arch.hasLabels}`);
        }

    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}

run();