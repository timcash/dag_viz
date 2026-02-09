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
        lib.startStep("04 Hover Exit");
        
        await lib.navigateTo(`http://localhost:${PORT}`);
        await new Promise(r => setTimeout(r, 500));

        // First move to A
        const coordsA = await lib.getProjectedCoords('node_A');
        if (coordsA) await lib.page.mouse.move(coordsA.x, coordsA.y);
        await new Promise(r => setTimeout(r, 200));

        // Move to empty space
        await lib.page.mouse.move(10, 10);
        await new Promise(r => setTimeout(r, 500));

        const hoveredNodeId = await lib.page.evaluate(() => (window as any).app.hoveredNodeId);
        assert.strictEqual(hoveredNodeId, null, "Hover should be null after exit");

        const logs = lib.logs.join('\n');
        assert(logs.includes('[v3-app] Hover change: null'), "Hover change log missing for null");

        await lib.snapshot("hover_exit");
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