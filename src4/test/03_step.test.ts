import { TestLibrary, PORT } from "./lib/TestLibrary";
import { PixelUtil } from "./pixel_util";

async function run() {
    const lib = new TestLibrary();
    await lib.init();
    try {
        await lib.navigateTo("http://localhost:" + PORT + "/?t=" + Date.now());
        lib.startStep("Step 3: Auto-generated Template");
        
        const isImplemented = await lib.page.evaluate(() => (window as any).app.isV4Implemented === true);
        if (!isImplemented) {
            lib.log("Status: Implementation Pending");
            await lib.snapshot("pending");
            throw new Error("Step 3 not yet implemented by agent");
        }

        await lib.page.evaluate(() => {
            const app = (window as any).app;
            const THREE = (window as any).THREE;
            app.stage.camera.position.set(50, 50, 50);
            app.moveCamera(new THREE.Vector3(-50, 20, 0), new THREE.Vector3(0, 0, 0), 0.0);
        });

        await lib.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

        await lib.logGeometry();

        const centerPixel = await PixelUtil.getPixel(lib.page, 640, 360);
        const isBackground = PixelUtil.isColorMatch(centerPixel, { r: 17, g: 17, b: 17 }, 5);
        lib.log("Center Pixel: " + PixelUtil.colorToString(centerPixel));
        
        await lib.snapshot("verification");
        
        if (!isBackground) {
            await lib.finishStep("PASSED", "Cube is visible ✅");
        } else {
            throw new Error("Step 3 Visual Verification Failed: Cube not visible");
        }
    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}
run();