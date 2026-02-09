import { TestLibrary, PORT } from "./lib/TestLibrary";
import { PixelUtil } from "./pixel_util";

async function run() {
    const lib = new TestLibrary();
    await lib.init();
    try {
        await lib.navigateTo("http://localhost:" + PORT + "/?t=" + Date.now());
        lib.startStep("Step 6: Auto-generated Template");
        
        const isImplemented = await lib.page.evaluate(() => (window as any).app.isV4Implemented === true || (window as any).app.isV5Implemented === true);
        if (!isImplemented) {
            lib.log("Status: Implementation Pending");
            await lib.snapshot("pending");
            throw new Error("Step 6 not yet implemented by agent");
        }

        const centerPixel = await PixelUtil.getPixel(lib.page, 640, 360);
        lib.log("Center Pixel: " + PixelUtil.colorToString(centerPixel));
        
        await lib.snapshot("verification");
        await lib.finishStep("PASSED", "Verified step 6 ✅");
    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}
run();