import puppeteer from 'puppeteer';
import { spawn, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { PixelUtil } from '../pixel_util';

export const TEST_MD = 'src4/TEST.md';
export const SCREENSHOTS_DIR = 'src4/screenshots';
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

        this.serverProcess = spawn('bun', ['run', 'server.ts'], { 
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
        const geo = await this.page.evaluate(() => {
            const app = (window as any).app;
            const camera = app.stage.camera;
            
            let nodeInfo = { worldPos: null, emissive: null, intensity: null };
            if (app.rootPlane && app.rootPlane.nodes) {
                const node = app.rootPlane.nodes.get('node_0');
                if (node) {
                    const worldPos = new (window as any).THREE.Vector3();
                    node.mesh.getWorldPosition(worldPos);
                    nodeInfo = {
                        worldPos: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
                        emissive: node.mesh.material.emissive.getHex(),
                        intensity: node.mesh.material.emissiveIntensity
                    };
                }
            }

            return {
                camera: {
                    pos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
                    rot: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z }
                },
                node0: nodeInfo
            };
        });
        this.log("GEOMETRY: Camera Pos: " + JSON.stringify(geo.camera.pos) + ", Rot: " + JSON.stringify(geo.camera.rot));
        if (geo.node0.worldPos) {
            this.log("GEOMETRY: Node_0 WorldPos: " + JSON.stringify(geo.node0.worldPos) + ", Emissive: 0x" + geo.node0.emissive?.toString(16) + ", Intensity: " + geo.node0.intensity);
        }
    }
}