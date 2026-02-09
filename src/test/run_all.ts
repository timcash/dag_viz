import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const TEST_MD = 'src/TEST.md';
const TEST_BAK = 'src/TEST.md.bak';
const SCREENSHOTS_DIR = 'src/screenshots';
const SCREENSHOTS_BAK = 'src/screenshots.bak';

const tests = [
    'src/test/01_infrastructure.test.ts',
    'src/test/02_architecture.test.ts',
    'src/test/03_edges.test.ts',
    'src/test/04_interaction.test.ts',
    'src/test/05_navigation.test.ts',
    'src/test/06_ui.test.ts',
    'src/test/07_editing.test.ts'
];

function prepareReport() {
    console.log("📦 Backing up previous test results...");
    
    // 1. Copy current to backup (if they exist)
    if (fs.existsSync(TEST_MD)) fs.copyFileSync(TEST_MD, TEST_BAK);
    if (fs.existsSync(SCREENSHOTS_DIR)) {
        if (fs.existsSync(SCREENSHOTS_BAK)) fs.rmSync(SCREENSHOTS_BAK, { recursive: true, force: true });
        execSync(`cp -r ${SCREENSHOTS_DIR} ${SCREENSHOTS_BAK}`);
    }

    // 2. Update Header only (don't wipe the file)
    let content = "";
    if (fs.existsSync(TEST_MD)) {
        content = fs.readFileSync(TEST_MD, 'utf8');
        // Replace first few lines (header)
        const lines = content.split('\n');
        const headerEndIndex = lines.findIndex(l => l.startsWith('---'));
        const newHeader = `# DAG Viz v2.0 - Topic-Specific Test Results\n\nGenerated on: ${new Date().toLocaleString()}\n\n`;
        
        if (headerEndIndex !== -1) {
            content = newHeader + lines.slice(headerEndIndex).join('\n');
        } else {
            content = newHeader + "---\n\n" + content;
        }
    } else {
        content = `# DAG Viz v2.0 - Topic-Specific Test Results\n\nGenerated on: ${new Date().toLocaleString()}\n\n---\n\n`;
    }
    
    fs.writeFileSync(TEST_MD, content);
}

console.log("🚀 Starting v2 Test Suite Run...");
prepareReport();

for (const test of tests) {
    console.log(`\n📂 Running: ${test}`);
    try {
        execSync(`bun run ${test}`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`❌ Test file failed: ${test}`);
    }
}

console.log("\n🎉 All test topics processed. Check src2/TEST.md for detailed results.");