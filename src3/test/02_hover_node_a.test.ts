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
        lib.startStep("02 Hover Node A");
        
        await lib.navigateTo(`http://localhost:${PORT}`);
        await new Promise(r => setTimeout(r, 500));

        const coords = await lib.getProjectedCoords('node_A');
        if (!coords) throw new Error("Could not find coords for node_A");

        await lib.page.mouse.move(coords.x, coords.y);
        await new Promise(r => setTimeout(r, 500));

        const hoveredNodeId = await lib.page.evaluate(() => (window as any).app.hoveredNodeId);
        assert.strictEqual(hoveredNodeId, 'node_A', "Node A should be hovered");

        const logs = lib.logs.join('\n');
        assert(logs.includes('[v3-app] Hover change: node_A'), "Hover change log missing for node_A");

        await lib.snapshot("hover_node_a");
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