import { TestLibrary, PORT } from "./lib/TestLibrary";
import { PixelUtil } from "./pixel_util";

async function run() {
    const lib = new TestLibrary();
    await lib.init();
    try {
        await lib.navigateTo("http://localhost:" + PORT + "/?t=" + Date.now());
        lib.startStep("Step 17: Global DSP Spatial Map");
        
        const isImplemented = await lib.page.evaluate(() => (window as any).app.isV5Implemented === true);
        if (!isImplemented) {
            lib.log("Status: Implementation Pending");
            await lib.snapshot("pending");
            throw new Error("Step 17 not yet implemented by agent");
        }

        const areSeparated = await lib.page.evaluate(() => {
            const n7 = (window as any).app.rootPlane.nodes.get('node_7');
            const n12 = (window as any).app.rootPlane.nodes.get('node_12');
            const n18 = (window as any).app.rootPlane.nodes.get('node_18');
            const p7 = new (window as any).THREE.Vector3();
            const p12 = new (window as any).THREE.Vector3();
            const p18 = new (window as any).THREE.Vector3();
            n7.subLayer.group.getWorldPosition(p7);
            n12.subLayer.group.getWorldPosition(p12);
            n18.subLayer.group.getWorldPosition(p18);
            
            const d7_12 = p7.distanceTo(p12);
            const d7_18 = p7.distanceTo(p18);
            const d12_18 = p12.distanceTo(p18);
            
            return d7_12 > 1 && d7_18 > 1 && d12_18 > 1;
        });

        if (!areSeparated) {
            throw new Error("Step 17 Failed: Global DSPs are overlapping");
        }

        await lib.logGeometry();
        await lib.snapshot("verification");
        await lib.finishStep("PASSED", "Global DSP spatial separation confirmed ✅");
    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}
run();
