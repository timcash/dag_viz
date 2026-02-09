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
        lib.startStep("05 Hover Reentry");
        
        await lib.navigateTo(`http://localhost:${PORT}`);
        await new Promise(r => setTimeout(r, 500));

        // Move to A, then exit, then back to A
        const coordsA = await lib.getProjectedCoords('node_A');
        if (coordsA) await lib.page.mouse.move(coordsA.x, coordsA.y);
        await new Promise(r => setTimeout(r, 200));

        await lib.page.mouse.move(10, 10);
        await new Promise(r => setTimeout(r, 200));

        if (coordsA) await lib.page.mouse.move(coordsA.x, coordsA.y);
        await new Promise(r => setTimeout(r, 500));

        const hoveredNodeId = await lib.page.evaluate(() => (window as any).app.hoveredNodeId);
        assert.strictEqual(hoveredNodeId, 'node_A', "Node A should be re-hovered");

        const logs = lib.logs.join('\n');
        assert(logs.includes('[v3-app] Hover change: node_A'), "Hover change log missing for reentry to node_A");

        await lib.snapshot("hover_reentry_a");
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