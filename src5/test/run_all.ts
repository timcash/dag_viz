import { execSync } from "child_process";
import * as fs from "fs";
const TEST_MD = "src5/TEST.md";
const tests = [
    'src5/test/01_step.test.ts',
    'src5/test/02_step.test.ts',
    'src5/test/03_step.test.ts',
    'src5/test/04_step.test.ts',
    'src5/test/05_step.test.ts',
    'src5/test/06_step.test.ts',
    'src5/test/07_step.test.ts',
    'src5/test/08_step.test.ts',
    'src5/test/09_step.test.ts',
    'src5/test/10_step.test.ts',
    'src5/test/11_step.test.ts',
    'src5/test/12_step.test.ts',
    'src5/test/13_step.test.ts',
    'src5/test/14_step.test.ts',
    'src5/test/15_step.test.ts',
    'src5/test/16_step.test.ts',
    'src5/test/17_step.test.ts',
    'src5/test/18_step.test.ts',
    'src5/test/19_step.test.ts',
    'src5/test/20_step.test.ts'
];
function prepare() {
    fs.writeFileSync(TEST_MD, "# src5 Results\n\nGenerated: " + new Date().toLocaleString() + "\n\n---\n\n");
}
console.log("🚀 Running src5 suite...");
prepare();
for (const test of tests) {
    console.log("\n📂 Running: " + test);
    try { execSync("bun run " + test, { stdio: "inherit" }); } catch (e) {}
}
