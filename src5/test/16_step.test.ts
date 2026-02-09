import { TestLibrary, PORT } from "./lib/TestLibrary";
import { PixelUtil } from "./pixel_util";

async function run() {
    const lib = new TestLibrary();
    await lib.init();
    try {
        await lib.navigateTo("http://localhost:" + PORT + "/?t=" + Date.now());
        lib.startStep("Step 16: Massive DSP Generation");
        
        const isImplemented = await lib.page.evaluate(() => (window as any).app.isV5Implemented === true);
        if (!isImplemented) {
            lib.log("Status: Implementation Pending");
            await lib.snapshot("pending");
            throw new Error("Step 16 not yet implemented by agent");
        }

        const subNodeCount = await lib.page.evaluate(() => {
            const node18 = (window as any).app.rootPlane.nodes.get('node_18');
            return node18 && node18.subLayer ? node18.subLayer.nodes.size : 0;
        });
        lib.log("Node 18 Sub-node Count: " + subNodeCount);

        if (subNodeCount !== 10) {
            throw new Error("Step 16 Failed: Expected 10 sub-nodes in node 18");
        }

        await lib.logGeometry();
        await lib.snapshot("verification");
        await lib.finishStep("PASSED", "Massive 10-node DSP initialized for node 18 ✅");
    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}
run();
