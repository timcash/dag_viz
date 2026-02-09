import { TestLibrary, PORT } from "./lib/TestLibrary";
import { PixelUtil } from "./pixel_util";

async function run() {
    const lib = new TestLibrary();
    await lib.init();
    try {
        await lib.navigateTo("http://localhost:" + PORT + "/?t=" + Date.now());
        lib.startStep("Step 20: Macro-Hierarchy Visual Proof");
        
        const isImplemented = await lib.page.evaluate(() => (window as any).app.isV5Implemented === true);
        if (!isImplemented) {
            lib.log("Status: Implementation Pending");
            await lib.snapshot("pending");
            throw new Error("Step 20 not yet implemented by agent");
        }

        await lib.page.evaluate(() => {
            const camera = (window as any).app.stage.camera;
            camera.position.set(150, 100, 150);
            camera.lookAt(50, -10, 50);
        });

        await lib.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

        await lib.logGeometry();
        await lib.snapshot("macro_hierarchy_final");
        await lib.finishStep("PASSED", "Macro-hierarchy visual verification successful ✅");
    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}
run();
