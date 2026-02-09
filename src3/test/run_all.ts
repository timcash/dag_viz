import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const tests = [
    'src3/test/01_initial_null.test.ts',
    'src3/test/02_hover_node_a.test.ts',
    'src3/test/03_hover_node_b.test.ts',
    'src3/test/04_hover_exit.test.ts',
    'src3/test/05_reentry.test.ts'
];

async function runAll() {
    console.log("🚀 Running all v3 tests...");
    
    // Clear TEST.md
    const TEST_MD = 'src3/TEST.md';
    if (fs.existsSync(TEST_MD)) {
        fs.unlinkSync(TEST_MD);
    }

    for (const test of tests) {
        console.log(`\n------------------------------------------------`);
        console.log(`🏃 Running: ${test}`);
        try {
            execSync(`bun run ${test}`, { stdio: 'inherit', timeout: 5000 });
        } catch (e) {
            console.error(`❌ Test failed (or timed out): ${test}`);
        }
    }
    
    console.log("\n✅ All v3 tests completed.");
}

runAll();