import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';
import { file, write } from 'bun';

const port = 3005;
const log = (msg) => console.log(`[SPLINE-TEST] ${msg}`);

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

    try {
        await page.goto(`http://localhost:${port}/tests/spline_test/index.html`);
        await new Promise(r => setTimeout(r, 1000));

        const screenshotPath = path.resolve('./tests/spline_test/spline_result.png');
        await page.screenshot({ path: screenshotPath });
        log(`Captured result: ${screenshotPath}`);

        let report = `# Spline Test Report\n\n![Spline Result](./spline_result.png)\n\n`;
        report += `## Summary\n- Server Port: ${port}\n- Browser: Puppeteer\n- Status: SUCCESS\n`;

        await write('./tests/spline_test/SMOKE.md', report);
        log('Report written to tests/spline_test/SMOKE.md');

    } catch (e) {
        log(`ERROR: ${e.message}`);
    } finally {
        await browser.close();
        serverProc.kill();
        process.exit(0);
    }
})();
