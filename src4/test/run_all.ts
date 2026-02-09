import { execSync } from "child_process";
import * as fs from "fs";
const TEST_MD = "src4/TEST.md";
const tests = [
    "src4/test/01_step.test.ts",
    "src4/test/02_step.test.ts",
    "src4/test/03_step.test.ts",
    "src4/test/04_step.test.ts",
    "src4/test/05_step.test.ts"
];
function prepare() {
    fs.writeFileSync(TEST_MD, "# src4 Results\n\nGenerated: " + new Date().toLocaleString() + "\n\n---\n\n");
}
console.log("🚀 Running src4 suite...");
prepare();
for (const test of tests) {
    console.log("\n📂 Running: " + test);
    try { execSync("bun run " + test, { stdio: "inherit" }); } catch (e) {}
}
