import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';
import { file, write } from 'bun';

const port = 3006;
const log = (msg) => console.log(`[HOVER-TEST] ${msg}`);

(async () => {
    log('Starting server...');
    const serverProc = spawn('bun', ['run', 'server.ts'], {
        env: { ...process.env, PORT: port.toString() },
        cwd: path.resolve('./')
    });

    await new Promise(r => setTimeout(r, 1000));

    log('Launching browser...');
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });

    const hoverLogs: string[] = [];
    page.on('console', msg => {
        const text = msg.text();
        if (text.startsWith('[Hover]')) {
            log(`[BROWSER] ${text}`);
            hoverLogs.push(text);
        }
    });

    try {
        await page.goto(`http://localhost:${port}/tests/hover_test/index.html`);
        await new Promise(r => setTimeout(r, 1000));

        // Nodes are at X: -6, 0, 6 in World. 
        // We'll move mouse across center and sides.

        log('Hovering Left Node...');
        await page.mouse.move(200, 300);
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: './tests/hover_test/hover_left.png' });

        log('Hovering Center Node...');
        await page.mouse.move(400, 300);
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: './tests/hover_test/hover_center.png' });

        log('Hovering Right Node...');
        await page.mouse.move(600, 300);
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: './tests/hover_test/hover_right.png' });

        let report = `# Hover Interaction Test Report\n\n`;
        report += `![Left](./hover_left.png) ![Center](./hover_center.png) ![Right](./hover_right.png)\n\n`;
        report += `## Summary\n- Server Port: ${port}\n- Status: ${hoverLogs.length >= 3 ? 'SUCCESS' : 'FAILURE'}\n`;
        report += `## Interaction Logs\n${hoverLogs.map(l => `- ${l}`).join('\n')}\n`;

        await write('./tests/hover_test/SMOKE.md', report);
        log('Report written to tests/hover_test/SMOKE.md');

    } catch (e) {
        log(`ERROR: ${e.message}`);
    } finally {
        await browser.close();
        serverProc.kill();
        process.exit(0);
    }
})();
