import { TestLibrary, PORT } from "./lib/TestLibrary";
import { PixelUtil } from "./pixel_util";

async function run() {
    const lib = new TestLibrary();
    await lib.init();
    try {
        await lib.navigateTo("http://localhost:" + PORT + "/?t=" + Date.now());
        lib.startStep("Step 1: Auto-generated Template");
        
        const isImplemented = await lib.page.evaluate(() => (window as any).app.isV4Implemented === true);
        if (!isImplemented) {
            lib.log("Status: Implementation Pending");
            await lib.snapshot("pending");
            throw new Error("Step 1 not yet implemented by agent");
        }

        await lib.page.evaluate(() => {
            const app = (window as any).app;
            const THREE = (window as any).THREE;
            app.moveCamera(new THREE.Vector3(0, 50, 0), new THREE.Vector3(0, 0, 0), 1.0, "Top-Down");
        });

        await lib.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

        await lib.logGeometry();

        const centerPixel = await PixelUtil.getPixel(lib.page, 640, 360);
        const isBlue = PixelUtil.isColorMatch(centerPixel, { r: 0, g: 0, b: 150 }, 100);
        lib.log("Center Pixel: " + PixelUtil.colorToString(centerPixel));
        
        await lib.snapshot("verification");
        
        if (isBlue) {
            await lib.finishStep("PASSED", "Center is blue ✅");
        } else {
            throw new Error("Step 1 Visual Verification Failed: Expected Blue");
        }
    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}
run();