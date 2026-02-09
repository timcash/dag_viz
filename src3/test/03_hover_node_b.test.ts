import { TestLibrary, PORT } from './lib/TestLibrary';
import assert from 'assert';

async function run() {
    const timeout = setTimeout(() => {
        console.error("Test timed out after 5s");
        process.exit(1);
    }, 5000);

    const lib = new TestLibrary();
    try {
        await lib.init();
        lib.startStep("03 Hover Node B");
        
        await lib.navigateTo(`http://localhost:${PORT}`);
        await new Promise(r => setTimeout(r, 500));

        // First move to A to ensure we are transitioning
        const coordsA = await lib.getProjectedCoords('node_A');
        if (coordsA) await lib.page.mouse.move(coordsA.x, coordsA.y);
        await new Promise(r => setTimeout(r, 200));

        const coordsB = await lib.getProjectedCoords('node_B');
        if (!coordsB) throw new Error("Could not find coords for node_B");

        await lib.page.mouse.move(coordsB.x, coordsB.y);
        await new Promise(r => setTimeout(r, 500));

        const hoveredNodeId = await lib.page.evaluate(() => (window as any).app.hoveredNodeId);
        assert.strictEqual(hoveredNodeId, 'node_B', "Node B should be hovered");

        const logs = lib.logs.join('\n');
        assert(logs.includes('[v3-app] Hover change: node_B'), "Hover change log missing for node_B");

        await lib.snapshot("hover_node_b");
        await lib.finishStep("PASSED");
    } catch (e) {
        await lib.reportFailure(e);
        process.exit(1);
    } finally {
        clearTimeout(timeout);
        await lib.cleanup();
        process.exit(0);
    }
}

run();