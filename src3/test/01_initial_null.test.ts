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
        lib.startStep("01 Initial Null State");
        
        await lib.navigateTo(`http://localhost:${PORT}`);
        await new Promise(r => setTimeout(r, 500));

        const hoveredNodeId = await lib.page.evaluate(() => (window as any).app.hoveredNodeId);
        assert.strictEqual(hoveredNodeId, null, "Initially no node should be hovered");

        const logs = lib.logs.join('\n');
        assert(logs.includes('[v3-app] System ready. Current hover: null'), "System ready log missing");

        await lib.snapshot("initial_state");
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