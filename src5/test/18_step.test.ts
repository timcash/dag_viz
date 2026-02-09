import { TestLibrary, PORT } from "./lib/TestLibrary";
import { PixelUtil } from "./pixel_util";

async function run() {
    const lib = new TestLibrary();
    await lib.init();
    try {
        await lib.navigateTo("http://localhost:" + PORT + "/?t=" + Date.now());
        lib.startStep("Step 18: VILL Thread Density");
        
        const isImplemented = await lib.page.evaluate(() => (window as any).app.isV5Implemented === true);
        if (!isImplemented) {
            lib.log("Status: Implementation Pending");
            await lib.snapshot("pending");
            throw new Error("Step 18 not yet implemented by agent");
        }

        const totalVills = await lib.page.evaluate(() => {
            const n7 = (window as any).app.rootPlane.nodes.get('node_7').subLayer.vills.length;
            const n12 = (window as any).app.rootPlane.nodes.get('node_12').subLayer.vills.length;
            const n18 = (window as any).app.rootPlane.nodes.get('node_18').subLayer.vills.length;
            return n7 + n12 + n18;
        });
        lib.log("Total VILL Count: " + totalVills);

        if (totalVills !== 15) {
            throw new Error("Step 18 Failed: Expected 15 total VILLs (3+2+10)");
        }

        await lib.logGeometry();
        await lib.snapshot("verification");
        await lib.finishStep("PASSED", "High-density VILL threads verified ✅");
    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}
run();
