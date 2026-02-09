import { TestLibrary, PORT } from "./lib/TestLibrary";
import { PixelUtil } from "./pixel_util";

async function run() {
    const lib = new TestLibrary();
    await lib.init();
    try {
        await lib.navigateTo("http://localhost:" + PORT + "/?t=" + Date.now());
        lib.startStep("Step 19: VILL Color Complexity");
        
        const isImplemented = await lib.page.evaluate(() => (window as any).app.isV5Implemented === true);
        if (!isImplemented) {
            lib.log("Status: Implementation Pending");
            await lib.snapshot("pending");
            throw new Error("Step 19 not yet implemented by agent");
        }

        const colorsMatch = await lib.page.evaluate(() => {
            const n7 = (window as any).app.rootPlane.nodes.get('node_7');
            const n12 = (window as any).app.rootPlane.nodes.get('node_12');
            const n18 = (window as any).app.rootPlane.nodes.get('node_18');
            const c7 = n7.subLayer.vills[0].line.material.color.getHex();
            const c12 = n12.subLayer.vills[0].line.material.color.getHex();
            const c18 = n18.subLayer.vills[0].line.material.color.getHex();
            return c7 === 0x0000ff && c12 === 0xffff00 && c18 === 0xff00ff;
        });

        if (!colorsMatch) {
            throw new Error("Step 19 Failed: VILL colors are not correctly differentiated (Blue vs Yellow vs Magenta)");
        }

        await lib.logGeometry();
        await lib.snapshot("verification");
        await lib.finishStep("PASSED", "Tri-color VILL orchestration complete ✅");
    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}
run();
