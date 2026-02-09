import { TestLibrary, PORT } from './lib/TestLibrary';

async function run() {
    const lib = new TestLibrary();
    await lib.init();

    try {
        await lib.navigateTo(`http://localhost:${PORT}/?t=${Date.now()}`);
        await new Promise(r => setTimeout(r, 1000));

        lib.startStep("Phase 6: Advanced UI & HUD");
        
        const ui = await lib.page.evaluate(() => {
            const breadcrumb = document.querySelector('.breadcrumb') as HTMLElement;
            const left = document.querySelector('.thumb-button-wrapper.left');
            const minimap = document.querySelector('.minimap') as HTMLCanvasElement;
            return {
                breadcrumb: breadcrumb?.innerText,
                hasButtons: !!left,
                hasMinimap: !!minimap
            };
        });

        lib.log(`UI: Breadcrumb="${ui.breadcrumb}", Buttons=${ui.hasButtons}, Minimap=${ui.hasMinimap}`);

        if (ui.breadcrumb && ui.hasButtons && ui.hasMinimap) {
            await lib.finishStep('PASSED');
        } else {
            throw new Error(`UI Failed: ${JSON.stringify(ui)}`);
        }

    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}

run();