import { TestLibrary, PORT, TEST_MD } from './lib/TestLibrary';
import { PixelUtil } from './pixel_util';
import * as fs from 'fs';

async function run() {
    const lib = new TestLibrary();
    await lib.init();

    try {
        lib.startStep("Phase 1: Infrastructure & Environment");
        
        // Step 0: Error Ping
        let caughtError = false;
        const errorHandler = (err: any) => { if (err.message.includes("Smoke Test Error")) caughtError = true; };
        lib.page.on('pageerror', errorHandler);
        await lib.page.goto(`http://localhost:${PORT}/?error-ping&t=${Date.now()}`);
        await new Promise(r => setTimeout(r, 500));
        lib.page.off('pageerror', errorHandler);
        
        if (!caughtError) throw new Error("Step 0 Failed: Error-ping not caught");
        lib.log("✅ Step 0: Error-ping caught successfully");

        // Step 1: Environment Verification
        await lib.navigateTo(`http://localhost:${PORT}/?t=${Date.now()}`);
        await new Promise(r => setTimeout(r, 1000));
        await lib.logGeometry();

        const bgPixel = await PixelUtil.getPixel(lib.page, 10, 10);
        const bgMatch = PixelUtil.isColorMatch(bgPixel, { r: 10, g: 10, b: 10 });
        
        const centerPixel = await PixelUtil.getPixel(lib.page, 640, 360);
        const centerMatch = bgPixel.r !== centerPixel.r;

        if (bgMatch && centerMatch) {
            await lib.finishStep('PASSED', `BG: ${PixelUtil.colorToString(bgPixel)}, Center: ${PixelUtil.colorToString(centerPixel)}`);
        } else {
            throw new Error(`Step 1 Failed: Colors BG=${bgMatch}, Center=${centerMatch}`);
        }

    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}

run();