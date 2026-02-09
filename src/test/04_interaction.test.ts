import { TestLibrary, PORT } from './lib/TestLibrary';

async function run() {
    const lib = new TestLibrary();
    await lib.init();

    try {
        await lib.navigateTo(`http://localhost:${PORT}/?t=${Date.now()}`);
        await new Promise(r => setTimeout(r, 1000));

        lib.startStep("Phase 4: Interaction & Hover Logic");
        
        const nodeScreenPos = await lib.page.evaluate(() => {
            const node = (window as any).app.rootPlane.nodes.get('node_0');
            const camera = (window as any).app.stage.camera;
            const worldPos = new (window as any).THREE.Vector3();
            node.mesh.getWorldPosition(worldPos);
            const pos = worldPos.clone().project(camera);
            return {
                x: (pos.x * 0.5 + 0.5) * window.innerWidth,
                y: (pos.y * -0.5 + 0.5) * window.innerHeight
            };
        });

        lib.log(`Hovering node_0 at ${Math.round(nodeScreenPos.x)}, ${Math.round(nodeScreenPos.y)}`);
        await lib.page.mouse.move(nodeScreenPos.x, nodeScreenPos.y);
        await new Promise(r => setTimeout(r, 200));

        const hover = await lib.page.evaluate(() => {
            const node = (window as any).app.rootPlane.nodes.get('node_0');
            return {
                intensity: node.mesh.material.emissiveIntensity,
                subVisible: node.subPlane.group.visible
            };
        });

        lib.log(`Intensity: ${hover.intensity}, SubVisible: ${hover.subVisible}`);
        
        if (hover.intensity > 1.0 && hover.subVisible) {
            await lib.finishStep('PASSED');
        } else {
            throw new Error(`Hover Failed: Intensity=${hover.intensity}, Visible=${hover.subVisible}`);
        }

    } catch (e) {
        await lib.reportFailure(e);
    } finally {
        await lib.cleanup();
        process.exit(0);
    }
}

run();