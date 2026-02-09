import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const targetDir = process.argv[2];

if (!targetDir) {
    console.error("Usage: bun run template_src.ts <dir_name>");
    process.exit(1);
}

const root = path.resolve('.');
const srcPath = path.join(root, targetDir);
const testPath = path.join(srcPath, 'test');
const libPath = path.join(testPath, 'lib');

// 1. Create Directories
console.log('📂 Creating ' + targetDir + ' structure...');
[srcPath, testPath, libPath, path.join(srcPath, 'screenshots')].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// 2. Copy shared test utilities
console.log("🔗 Copying testing libraries...");
const sharedTestPath = path.join(root, 'src', 'test');
fs.copyFileSync(path.join(sharedTestPath, 'pixel_util.ts'), path.join(testPath, 'pixel_util.ts'));
fs.copyFileSync(path.join(sharedTestPath, 'lib', 'TestLibrary.ts'), path.join(libPath, 'TestLibrary.ts'));

// 3. Fix paths in copied TestLibrary
let libContent = fs.readFileSync(path.join(libPath, 'TestLibrary.ts'), 'utf8');
libContent = libContent.replace(/export const TEST_MD = 'src\/TEST\.md'/g, "export const TEST_MD = '" + targetDir + "/TEST.md'");
libContent = libContent.replace(/export const SCREENSHOTS_DIR = 'src\/screenshots'/g, "export const SCREENSHOTS_DIR = '" + targetDir + "/screenshots'");
fs.writeFileSync(path.join(libPath, 'TestLibrary.ts'), libContent);

// 4. Generate Domain Skeletons
console.log("🛠️ Generating domain skeletons...");
fs.writeFileSync(path.join(srcPath, 'Stage.ts'), 
'import * as THREE from "three";\n' +
'export class Stage {\n' +
'    scene = new THREE.Scene();\n' +
'    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);\n' +
'    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });\n' +
'    constructor() {\n' +
'        this.scene.background = new THREE.Color(0x111111);\n' +
'        this.renderer.setSize(window.innerWidth, window.innerHeight);\n' +
'        this.renderer.setClearColor(0x111111, 1);\n' +
'        const container = document.getElementById("canvas-container") || document.body;\n' +
'        container.appendChild(this.renderer.domElement);\n' +
'        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));\n' +
'        const dirLight = new THREE.DirectionalLight(0xffffff, 1);\n' +
'        dirLight.position.set(50, 50, 50);\n' +
'        this.scene.add(dirLight);\n' +
'    }\n' +
'    render() { this.renderer.render(this.scene, this.camera); }\n' +
'}');

fs.writeFileSync(path.join(srcPath, 'App.ts'), 
'import { Stage } from "./Stage";\n' +
'import * as THREE from "three";\n' +
'export class App {\n' +
'    stage = new Stage();\n' +
'    isV4Implemented = false;\n' +
'    constructor() {\n' +
'        const box = new THREE.Mesh(new THREE.BoxGeometry(5,5,5), new THREE.MeshPhongMaterial({color: 0x00ff00}));\n' +
'        this.stage.scene.add(box);\n' +
'        this.animate();\n' +
'    }\n' +
'    private animate() {\n' +
'        requestAnimationFrame(() => this.animate());\n' +
'        this.stage.render();\n' +
'    }\n' +
'    moveCamera(pos: THREE.Vector3, target: THREE.Vector3, alpha: number) {\n' +
'        // Implementation here\n' +
'    }\n' +
'}\n' +
'(window as any).app = new App();\n' +
'(window as any).THREE = THREE;');

// 5. Generate 5 Failing Test Templates
console.log("🧪 Generating 5 failing test templates...");
for (let i = 1; i <= 5; i++) {
    const fileName = '0' + i + '_step.test.ts';
    const content = 
'import { TestLibrary, PORT } from "./lib/TestLibrary";\n' +
'import { PixelUtil } from "./pixel_util";\n\n' +
'async function run() {\n' +
'    const lib = new TestLibrary();\n' +
'    await lib.init();\n' +
'    try {\n' +
'        await lib.navigateTo("http://localhost:" + PORT + "/?t=" + Date.now());\n' +
'        lib.startStep("Step ' + i + ': Auto-generated Template");\n' +
'        \n' +
'        const isImplemented = await lib.page.evaluate(() => (window as any).app.isV4Implemented === true);\n' +
'        if (!isImplemented) {\n' +
'            lib.log("Status: Implementation Pending");\n' +
'            await lib.snapshot("pending");\n' +
'            throw new Error("Step ' + i + ' not yet implemented by agent");\n' +
'        }\n\n' +
'        const centerPixel = await PixelUtil.getPixel(lib.page, 640, 360);\n' +
'        const isGreen = PixelUtil.isColorMatch(centerPixel, { r: 0, g: 150, b: 0 }, 100);\n' +
'        lib.log("Center Pixel: " + PixelUtil.colorToString(centerPixel));\n' +
'        \n' +
'        await lib.snapshot("verification");\n' +
'        \n' +
'        if (isGreen) {\n' +
'            await lib.finishStep("PASSED", "Center is green ✅");\n' +
'        } else {\n' +
'            throw new Error("Step ' + i + ' Visual Verification Failed");\n' +
'        }\n' +
'    } catch (e) {\n' +
'        await lib.reportFailure(e);\n' +
'    } finally {\n' +
'        await lib.cleanup();\n' +
'        process.exit(0);\n' +
'    }\n' +
'}\n' +
'run();';
    fs.writeFileSync(path.join(testPath, fileName), content);
}

// 6. Generate run_all.ts
fs.writeFileSync(path.join(testPath, 'run_all.ts'), 
'import { execSync } from "child_process";\n' +
'import * as fs from "fs";\n' +
'const TEST_MD = "' + targetDir + '/TEST.md";\n' +
'const tests = [\n' +
'    "' + targetDir + '/test/01_step.test.ts",\n' +
'    "' + targetDir + '/test/02_step.test.ts",\n' +
'    "' + targetDir + '/test/03_step.test.ts",\n' +
'    "' + targetDir + '/test/04_step.test.ts",\n' +
'    "' + targetDir + '/test/05_step.test.ts"\n' +
'];\n' +
'function prepare() {\n' +
'    fs.writeFileSync(TEST_MD, "# ' + targetDir + ' Results\\n\\nGenerated: " + new Date().toLocaleString() + "\\n\\n---\\n\\n");\n' +
'}\n' +
'console.log("🚀 Running ' + targetDir + ' suite...");\n' +
'prepare();\n' +
'for (const test of tests) {\n' +
'    console.log("\\n📂 Running: " + test);\n' +
'    try { execSync("bun run " + test, { stdio: "inherit" }); } catch (e) {}\n' +
'}\n');

// 7. Update package.json
console.log("📝 Updating package.json...");
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
pkg.scripts['build_' + targetDir] = 'bun build ./' + targetDir + '/App.ts --outdir ./dist --bundle';
pkg.scripts['test_' + targetDir] = 'bun run ./' + targetDir + '/test/run_all.ts';
fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg, null, 2));

console.log('\n✅ ' + targetDir + ' scaffolded successfully!');

// --- Verification Step ---
console.log('🧪 Starting self-verification test for ' + targetDir + '...');

try {
    console.log('🔨 Building ' + targetDir + '...');
    execSync('bun run build_' + targetDir, { stdio: 'inherit' });

    console.log('🚀 Running initial test (expecting deliberate failure)...');
    // Note: The template test is designed to fail with "Implementation Pending"
    try {
        execSync('bun run ' + targetDir + '/test/01_step.test.ts', { stdio: 'inherit' });
    } catch (e) {
        console.log('ℹ️ Template test failed as expected (Step 1 not yet implemented).');
    }

    // Verify TEST.md exists and has content
    const testMdPath = path.join(srcPath, 'TEST.md');
    if (fs.existsSync(testMdPath)) {
        const content = fs.readFileSync(testMdPath, 'utf8');
        const hasLogs = content.includes('### Logs');
        const hasSnapshot = content.includes('failure_latest.png'); // Looking for failure snapshot
        const hasPending = content.includes('Implementation Pending');

        if (hasLogs && hasSnapshot && hasPending) {
            console.log('✅ TEST.md format verified successfully!');
        } else {
            console.error('❌ TEST.md content verification failed. Found snapshot: ' + hasSnapshot + ', Logs: ' + hasLogs + ', Pending: ' + hasPending);
            process.exit(1);
        }
    } else {
        console.error('❌ TEST.md was not generated.');
        process.exit(1);
    }

    console.log('\n✨ ' + targetDir + ' is ready for development!');
} catch (error) {
    console.error('❌ Verification failed: ', error);
    process.exit(1);
}