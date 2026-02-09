import { TestLibrary, PORT } from './lib/TestLibrary';

async function run() {
    const lib = new TestLibrary();
    await lib.init();

    try {
        await lib.navigateTo(`http://localhost:${PORT}/?t=${Date.now()}`);
        await new Promise(r => setTimeout(r, 1000));

        lib.startStep("Phase 5: Navigation & Pathing");
        
        const nodeScreenPos = await lib.page.evaluate(() => {
            const node = (window as any).app.rootPlane.nodes.get('node_0');
            const camera = (window as any).app.stage.camera;
            const worldPos = new (window as any).THREE.Vector3();
            node.mesh.getWorldPosition(worldPos);
            const pos = worldPos.clone().project(camera);
            return { x: (pos.x * 0.5 + 0.5) * window.innerWidth, y: (pos.y * -0.5 + 0.5) * window.innerHeight };
        });

        lib.log("Clicking to dive...");
        await lib.page.mouse.click(nodeScreenPos.x, nodeScreenPos.y);
        await new Promise(r => setTimeout(r, 500));
        await lib.snapshot("dived");

        const dive = await lib.page.evaluate(() => {
            return {
                path: (window as any).app.navigator.path,
                cameraY: (window as any).app.stage.camera.position.y
            };
        });
        lib.log(`Dive Result: Path=${dive.path}, Y=${dive.cameraY}`);

        lib.log("Scrubbing Up...");
        await lib.page.mouse.wheel({ deltaY: -100 });
        await new Promise(r => setTimeout(r, 500));
        await lib.snapshot("scrubbed_up");

        const up = await lib.page.evaluate(() => (window as any).app.navigator.path.length);
        lib.log(`Scrub Up: PathLength=${up}`);

        if (dive.path.includes('node_0') && up === 0) {
            await lib.finishStep('PASSED');
        } else {
            throw new Error(`Navigation Failed: Dive=${dive.path}, UpLength=${up}`);
        }

    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}

run();