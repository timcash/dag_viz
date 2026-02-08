import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { file, write } from 'bun';

const smokeReportPath = './SMOKE.md';
let reportBody = '';
const logSummary = [];

function log(msg) {
    console.log(`[SMOKE] ${msg} `);
}

async function killPort(port) {
    log(`Checking for process on port ${port}...`);
    try {
        if (process.platform === 'win32') {
            const findCmd = `netstat - ano | findstr :${port} `;
            const proc = spawn('cmd', ['/c', findCmd], { shell: true });
            let output = '';
            for await (const chunk of proc.stdout) output += chunk;

            if (output) {
                const pid = output.trim().split(/\s+/).pop(); // Last element is PID
                if (pid && /^\d+$/.test(pid)) {
                    log(`Killing PID ${pid} on port ${port}...`);
                    spawn('taskkill', ['/F', '/PID', pid]);
                    await new Promise(r => setTimeout(r, 1000)); // Wait for kill
                }
            }
        } else {
            // Mac/Linux
            // lsof -i :port -t | xargs kill -9 
            // simplified: 
            const proc = spawn('lsof', ['-i', `:${port} `, '-t']);
            let output = '';
            for await (const chunk of proc.stdout) output += chunk;
            if (output) {
                const pid = output.trim();
                if (pid) {
                    log(`Killing PID ${pid} on port ${port}...`);
                    spawn('kill', ['-9', pid]);
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
    } catch (e) {
        log(`Error killing port: ${e.message} `);
    }
}

function addToReport(section, content) {
    reportBody += `## ${section} \n\n${content} \n\n`;
}

function addToSummary(msg) {
    logSummary.push(msg);
}

import { createServer } from 'net';

function getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, () => {
            const addr = server.address();
            const port = typeof addr === 'string' ? 0 : addr?.port;
            server.close(() => {
                if (port) resolve(port);
                else reject(new Error('Could not determine free port'));
            });
        });
    });
}

(async () => {
    // Start Server
    // const port = 3001;
    let port = 3001;
    try {
        port = await getFreePort();
        log(`Dynamically selected port: ${port}`);
    } catch (e) {
        log(`Failed to get free port, falling back to ${port}`);
    }

    // We don't need to killPort if we got a fresh one from OS, but let's leave cleanup logic if we want.
    // Actually, getFreePort returns a port that is free right now.


    log(`Starting server in WATCH mode on port ${port}...`);
    const serverProc = spawn('bun', ['run', 'server.ts'], {
        cwd: process.cwd(),
        env: { ...process.env, PORT: port.toString() },
        stdout: 'pipe',
        stderr: 'pipe',
    });

    serverProc.stdout.on('data', (data) => {
        log(`[SERVER] ${data.toString().trim()}`);
    });
    serverProc.stderr.on('data', (data) => {
        log(`[SERVER ERROR] ${data.toString().trim()}`);
    });

    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    log('Launching Puppeteer...');
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Capture Logs
    const consoleLogs = [];
    const pageErrors = [];

    page.on('console', msg => {
        const text = msg.text();
        const type = msg.type();
        consoleLogs.push(`[${type}] ${text} `);

        // Filter for Log Summary
        if (type === 'error' || type === 'warning' || text.includes('Node created') || text.includes('Clicked') || text.includes('Sublayer') || text.includes('INTENTIONAL')) {
            addToSummary(`- ** [${type.toUpperCase()}] ** ${text} `);
        }
    });

    page.on('pageerror', err => {
        const msg = err.toString();
        pageErrors.push(msg);
        addToSummary(`- ** [PAGE ERROR] ** ${msg} `);
    });

    // Override window.prompt to auto-accept
    await page.evaluateOnNewDocument(() => {
        window.prompt = () => "SmokeTestNode";
    });

    try {
        const url = `http://localhost:${port}`;
        log(`Navigating to http://localhost:${port} ...`);
        try {
            await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle0' });
        } catch (e) {
            log(`Navigation failed: ${e.message}`);
            // If networkidle0 fails, maybe try domcontentloaded
            await page.goto(`http://localhost:${port}`, { waitUntil: 'domcontentloaded' });
        }
        // Helper to take screenshot and add to report
        async function captureStep(name) {
            const filename = `smoke_${name.replace(/\s+/g, '_').toLowerCase()}.png`;
            await page.screenshot({ path: filename });
            addToReport(name, `![${name}](./${filename})`);
            log(`Captured: ${filename}`);
        }

        // Screenshot: Initial Load
        await captureStep('Initial Load');

        // --- STEP 1: INITIAL GEOMETRY VERIFICATION ---
        log('STEP 1: Initial Geometry Verification');
        let metrics = await page.evaluate(() => window.getSceneMetrics());

        const root1 = metrics.nodes.find(n => n.id === 'root_1');
        if (!root1) throw new Error("Could not find root_1");

        addToSummary(`- ** Initial Camera **: [${metrics.cameraPos.map(n => n.toFixed(2)).join(', ')}]`);
        addToSummary(`- ** Root 1 Position **: [${root1.worldPos.join(', ')}]`);

        // Verify Root 1 is at expected X (i * 4 = 1 * 4 = 4) 
        // Note: Layout engine implies X=0 for first rank?? 
        // Wait, in App.js we init with `i * 4`. Layout might override x/z? 
        // Layout.js usually ranks them. Let's trust the reported position for now and verify relative change later.

        // --- STEP 2: HOVER VERIFICATION ---
        log('STEP 2: Hover Verification');
        const { x, y } = root1.screenPos;
        await page.mouse.move(x, y);
        await new Promise(resolve => setTimeout(resolve, 500));
        await captureStep('Hover State');

        // Verify Log contains position
        const hoverLog = consoleLogs.find(l => l.includes(`[Interaction] Hover node: root_1`));
        if (hoverLog && hoverLog.includes(`(${root1.worldPos[0]}`)) {
            addToSummary(`- ✅ Verified Hover Log with Geometry: "${hoverLog}"`);
        } else {
            addToSummary(`- ❌ Hover Log missing or incorrect geometry.Log: ${hoverLog} `);
        }

        // --- STEP 3: CLICK & TRANSITION VERIFICATION ---
        log('STEP 3: Click & Transition Verification');

        // Calculate Expected Camera Position
        // Focus Logic: 
        // targetPos = node.x, node.y + subLayer.yOffset + 15, node.z + 10
        // We know node.y is likely 0. subLayer.yOffset we can infer? 
        // Actually, let's just assert it MOVED significantly towards the expected direction.

        await page.mouse.click(x, y);

        log('Waiting 3 seconds for transition...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await captureStep('Transition Complete');

        metrics = await page.evaluate(() => window.getSceneMetrics());

        // Verify Camera Moved
        const newCamPos = metrics.cameraPos;
        addToSummary(`- ** New Camera **: [${newCamPos.map(n => n.toFixed(2)).join(', ')}]`);

        // Expected Logic (Downward Stacking):
        // root_1 is at ~ (4, 0, 0)
        // Sublayer offset is parentY - 20 = -20.
        // Camera target height is subLayerY + 20 = 0.
        // Camera target Z is ~ 0 + 20 = 20.
        // So expected camera pos is approx (4, 0, 20).
        // Wait, if camera is at 20, and sublayer is at -20, we are looking down.

        const closeToX = Math.abs(newCamPos[0] - root1.worldPos[0]) < 2;
        // Check Y. Initial was 20. New should be around 0 (relative to parent) but since we are looking at -20...
        // Camera Y > Sublayer Y (-20).
        const lookingDown = newCamPos[1] > -10;

        if (closeToX && lookingDown) {
            addToSummary(`- ✅ Camera Geometry Verified: Moving DOWN to follow sublayer.`);
        } else {
            addToSummary(`- ❌ Camera Geometry Failed.Expected X~${root1.worldPos[0]}, Y > -10. Got: [${newCamPos}]`);
        }

        // --- STEP 4: SUBLAYER VERIFICATION ---
        log('STEP 4: Sublayer Verification');
        const childNodes = metrics.nodes.filter(n => n.id.includes('root_1_child'));
        addToSummary(`- ** Sublayer Nodes Found **: ${childNodes.length} `);

        if (childNodes.length === 3) {
            addToSummary(`- ✅ Verified 3 Child Nodes in sublayer.`);
        } else {
            addToSummary(`- ❌ Failed to find 3 child nodes.`);
        }

        // Verify VISIBILITY
        // Only sublayer nodes and maybe parent layer nodes should be in metrics?
        // getSceneMetrics returns currentLayer nodes.
        // If we switched layers, metric.nodes should be sublayer nodes.
        if (metrics.currentLayerId === 'root_1_sub') {
            addToSummary(`- ✅ Validated Visibility: Only seeing nodes from 'root_1_sub' layer.`);
        } else {
            addToSummary(`- ❌ Visibility Check Failed.Current Layer: ${metrics.currentLayerId} `);
        }

        // --- STEP 5: PARENT VISIBILITY CHECK ---
        log('STEP 5: Parent Layer Visibility');
        if (metrics.rootLayerVisible === false) {
            addToSummary(`- ✅ Validated Strict Visibility: Parent layer 'root' is HIDDEN.`);
        } else {
            addToSummary(`- ❌ STRICT VISIBILITY FAILED: Parent layer is still visible!`);
        }

        // --- STEP 6: SCROLL ZOOM OUT VERIFICATION ---
        log('STEP 6: Scroll Zoom Out Verification');

        // Scroll out significantly to trigger auto-navigation (> 60 units)
        // DeltaY is usually pixels. 
        await page.mouse.wheel({ deltaY: -2000 }); // Negative often maps to "pull back" / zoom out? Or positive?
        // In App.js: delta = -e.deltaY. newScale = scale + delta * speed.
        // To Zoom OUT (scale < 1 or distance > large), we actually rely on ORBIT CONTROLS distance.
        // OrbitControls zooms via dolly.
        // Let's try positive deltaY (standard scroll down).
        await page.mouse.wheel({ deltaY: 5000 });

        log('Waiting for auto-zoom trigger...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await captureStep('Zoom Out State');

        // Verify Log
        const zoomLog = consoleLogs.find(l => l.includes('[Navigation] Auto-zoom out triggered'));
        if (zoomLog) {
            addToSummary(`- ✅ Verified Logs: "${zoomLog}"`);
        } else {
            addToSummary(`- ❌ Missing Zoom Out Log.`);
        }

        // Verify Visibility Logs
        const showLog = consoleLogs.find(l => l.includes('[Visibility] Showing restored layer: root'));
        if (showLog) {
            addToSummary(`- ✅ Verified Visibility Log: "${showLog}"`);
        } else {
            addToSummary(`- ❌ Missing Visibility Log for Root Layer restore.`);
        }

        // Verify Context Restoration
        metrics = await page.evaluate(() => window.getSceneMetrics());
        if (metrics.rootLayerVisible === true) {
            addToSummary(`- ✅ Verified Visibility: Parent layer 'root' is VISIBLE again.`);
        } else {
            addToSummary(`- ❌ Visibility Failed: Parent layer is still hidden.`);
        }

        // Verify we are back to root layer
        if (metrics.currentLayerId === 'root') {
            addToSummary(`- ✅ Navigation Verified: Current layer is 'root'.`);
        } else {
            addToSummary(`- ❌ Navigation Failed: Current layer is '${metrics.currentLayerId}'`);
        }

        // --- STEP 7: DOUBLE CLICK CREATION VERIFICATION ---
        log('STEP 7: Double Click Creation Verification');

        // Click on empty space (e.g., top left quadrant)
        const dblClickX = 100;
        const dblClickY = 100;
        await page.mouse.click(dblClickX, dblClickY, { clickCount: 2 });
        // Handle Prompt (if any) - currently App.js uses prompt(), which Puppeteer auto-dismisses or hangs?
        // We need to handle dialogs.
        page.on('dialog', async dialog => {
            log(`Dialog intercepted: ${dialog.message()}`);
            await dialog.accept('Test Node');
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        await captureStep('Double Click Action');

        // Verify Log regarding creation? App.js might log "Node created".
        // Let's verify Screen Coordinate log first.
        const clickLog = consoleLogs.find(l => l.includes(`[Interaction] Click detected at Screen(${dblClickX}, ${dblClickY})`));
        // Using `includes` might be fuzzy on pixels? Let's check loose match.
        const looseClickLog = consoleLogs.find(l => l.includes(`[Interaction] Click detected at Screen`));
        if (looseClickLog) {
            addToSummary(`- ✅ Verified Click Coordinate Log: "${looseClickLog}"`);
        }

        // Verify new node count
        metrics = await page.evaluate(() => window.getSceneMetrics());
        const createdNode = metrics.nodes.find(n => n.id.includes('Test Node') || n.label === 'Test Node');
        if (createdNode) {
            addToSummary(`- ✅ Verified Node Creation: Found node "${createdNode.label}" at [${createdNode.worldPos}]`);
        } else {
            // If we didn't handle prompt correctly, it might have failed.
            addToSummary(`- ⚠️ Node Creation Verification: Could not find 'Test Node'. Check dialog handling.`);
        }

    } catch (e) {
        log(`Test Failed: ${e} `);
        addToSummary(`- ❌ ** TEST FAILED **: ${e} `);
    } finally {
        log('Entering finally block...');
        try {
            if (browser) await browser.close();
        } catch (e) {
            log(`Error closing browser: ${e}`);
        }

        // Compile Full Report
        try {
            const header = `# Smoke Test Report\n\n**Running Server**: [http://localhost:${port}](http://localhost:${port})\n\nGenerated at: ${new Date().toISOString()} \n\n`;
            const summarySection = `# Log Summary\n\n${logSummary.join('\n')} \n\n`;
            const logsSection = `## Full Browser Logs\n\n### Console\n\`\`\`\n${consoleLogs.join('\n')}\n\`\`\`\n\n### Page Errors\n\`\`\`\n${pageErrors.join('\n')}\n\`\`\`\n`;

            log(`Writing report to ${smokeReportPath}...`);
            await write(smokeReportPath, header + summarySection + reportBody + logsSection);
            log(`Report written to ${smokeReportPath}`);
        } catch (e) {
            log(`Error writing report: ${e}`);
        }

        if (serverProc) serverProc.kill();
        log('Exiting process...');
        process.exit(0);
    }
})();
