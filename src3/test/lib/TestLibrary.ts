import puppeteer from 'puppeteer';
import { spawn, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { PixelUtil } from '../../../src/test/pixel_util';

export const TEST_MD = 'src3/TEST.md';
export const SCREENSHOTS_DIR = 'src3/screenshots';
export const PORT = 3001;

export class TestLibrary {
    logs: string[] = [];
    currentStep: string = "";
    page!: puppeteer.Page;
    browser!: puppeteer.Browser;
    serverProcess: any = null;
    snapshots: string[] = [];

    constructor() {
        if (!fs.existsSync(SCREENSHOTS_DIR)) {
            fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
        }
    }

    async init() {
        try { execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: 'ignore' }); } catch(e) {}

        this.serverProcess = spawn('bun', ['run', 'dev_v3'], { 
            shell: true,
            env: { ...process.env, PORT: PORT.toString() }
        });
        
        await new Promise(r => setTimeout(r, 2000));

        this.browser = await puppeteer.launch({ headless: "new" });
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1280, height: 720 });

        this.page.on('console', msg => this.log(`BROWSER: [${msg.type()}] ${msg.text()}`));
        this.page.on('pageerror', err => this.log(`PAGE ERROR: ${err.message}`));
    }

    startStep(name: string) {
        this.currentStep = name;
        this.logs = [];
        this.snapshots = [];
        const msg = "\n🚀 Starting Step: " + name;
        console.log(msg);
        this.logs.push(msg);
    }

    log(message: string) {
        const msg = "[" + new Date().toLocaleTimeString() + "] " + message;
        console.log(msg);
        this.logs.push(msg);
    }

    async snapshot(label: string) {
        const safeName = this.currentStep.toLowerCase().replace(/[^a-z0-9]/g, '_') + "_" + label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const screenshotPath = path.join(SCREENSHOTS_DIR, safeName + ".png");
        
        await this.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        await this.page.screenshot({ path: screenshotPath });
        
        if (!this.snapshots.includes(safeName)) {
            this.snapshots.push(safeName);
        }
        this.log("📸 Snapshot captured: " + label);
    }

    async finishStep(status: 'PASSED' | 'FAILED', pixelData?: string) {
        if (this.snapshots.length === 0) {
            await this.snapshot('final');
        }

        const logsStr = this.logs.join('\n');
        let pixelMd = "";
        if (pixelData) {
            pixelMd = "### Pixel Verification\n" + pixelData + "\n\n";
        }
        
        let snapshotsMd = "### Screenshots\n";
        this.snapshots.forEach(s => {
            snapshotsMd += "![" + s + "](./screenshots/" + s + ".png)\n\n";
        });

        const mdEntry = "## " + this.currentStep + " (" + new Date().toLocaleTimeString() + ") - " + (status === 'PASSED' ? '✅' : '❌') + "\n\n" +
                        pixelMd +
                        "### Logs\n```\n" + logsStr + "\n```\n\n" +
                        snapshotsMd +
                        "---\n\n";
        
        this.updateMarkdown(mdEntry);
        console.log("🏁 Finished Step: " + this.currentStep + " (" + status + ")");
    }

    private updateMarkdown(mdEntry: string) {
        if (!fs.existsSync(TEST_MD)) {
            fs.writeFileSync(TEST_MD, mdEntry);
            return;
        }

        let content = fs.readFileSync(TEST_MD, 'utf8');
        const headerMarker = "## " + this.currentStep;
        
        // Find existing section
        const lines = content.split('\n');
        let startIndex = -1;
        let endIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith(headerMarker)) {
                startIndex = i;
                // Find next header or end
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].startsWith('## ')) {
                        endIndex = j;
                        break;
                    }
                }
                break;
            }
        }

        if (startIndex !== -1) {
            // Replace existing section
            const before = lines.slice(0, startIndex);
            const after = endIndex !== -1 ? lines.slice(endIndex) : [];
            content = [...before, mdEntry.trim(), ...after].join('\n');
        } else {
            // Append new section
            content = content.trim() + "\n\n---\n\n" + mdEntry;
        }

        fs.writeFileSync(TEST_MD, content);
    }

    async reportFailure(error: any) {
        this.log("❌ CRITICAL FAILURE: " + (error.message || error));
        
        const safeName = "failure_latest";
        const screenshotPath = path.join(SCREENSHOTS_DIR, safeName + ".png");
        if (this.page) await this.page.screenshot({ path: screenshotPath });

        const errorStack = error.stack || error;
        const logsStr = this.logs.join('\n');

        const mdEntry = "## 💥 Latest Failure - ❌\n\n" +
                        "### Error\n```\n" + errorStack + "\n```\n\n" +
                        "### Logs\n```\n" + logsStr + "\n```\n\n" +
                        "### Failure Screenshot\n![Failure](./screenshots/" + safeName + ".png)\n\n" +
                        "---\n\n";
        
        this.updateMarkdown(mdEntry);
    }

    async navigateTo(url: string) {
        this.log("Navigating to " + url + "...");
        await this.page.goto(url);
        await this.page.evaluate(() => {
            (window as any).DISABLE_LIVE_RELOAD = true;
            if ((window as any).socket) (window as any).socket.close();
        });
    }

    async cleanup() {
        if (this.browser) await this.browser.close().catch(() => {});
        if (this.serverProcess) this.serverProcess.kill('SIGKILL');
    }

    async logGeometry() {
        const geo = await this.page.evaluate(async () => {
            const THREE = await import('three');
            const app = (window as any).app;
            const camera = app.stage.camera;
            const nodeA = app.nodes.find((n: any) => n.id === 'node_A');
            const worldPos = new THREE.Vector3();
            if (nodeA) nodeA.mesh.getWorldPosition(worldPos);

            return {
                camera: {
                    pos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
                    rot: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z }
                },
                nodeA: {
                    worldPos: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
                    emissive: nodeA ? nodeA.mesh.material.emissive.getHex() : null
                }
            };
        });
        this.log("GEOMETRY: Camera Pos: " + JSON.stringify(geo.camera.pos));
        this.log("GEOMETRY: Node_A WorldPos: " + JSON.stringify(geo.nodeA.worldPos) + ", Emissive: 0x" + geo.nodeA.emissive?.toString(16));
    }

    async getProjectedCoords(nodeId: string) {
        return await this.page.evaluate(async (id) => {
            const THREE = await import('three');
            const app = (window as any).app;
            const node = app.nodes.find((n: any) => n.id === id);
            if (!node) return null;

            const vector = new THREE.Vector3();
            node.mesh.getWorldPosition(vector);
            vector.project(app.stage.camera);

            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
            return { x, y };
        }, nodeId);
    }
}
