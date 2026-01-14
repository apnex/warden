const { resolve } = require('../engine/path_resolver');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = resolve.root();
const VIOLATION_DIR = path.join(ROOT, 'unauthorized_folder');

function test() {
    console.log("\n====================================================");
    console.log("      🧪 WARDEN GOVERNANCE: AUDIT TEST RUNNER");
    console.log("====================================================\n");

    // 1. Positive Test: System should pass now
    console.log("[Test 1] Verifying current system state (should PASS)...");
    try {
        execSync('node validation/audit_standards.js', { stdio: 'inherit' });
        console.log("  [Result] Success: Auditor passed stable state.");
    } catch (e) {
        console.error("  [Result] FAILED: Auditor failed on stable state.");
        process.exit(1);
    }

    // 2. Negative Test: Inject violation
    console.log("\n[Test 2] Injecting STD_FILE_CONSOLIDATION violation...");
    if (!fs.existsSync(VIOLATION_DIR)) fs.mkdirSync(VIOLATION_DIR);
    
    console.log("[Test 2] Running audit on dirty state (should FAIL)...");
    try {
        execSync('node validation/audit_standards.js', { stdio: 'pipe' });
        console.error("  [Result] FAILED: Auditor did not detect the violation.");
        cleanup();
        process.exit(1);
    } catch (e) {
        console.log("  [Result] Success: Auditor correctly detected and blocked violation.");
    }

    cleanup();
    console.log("\n====================================================");
    console.log("      ✨ ALL TESTS PASSED: AUDITOR PROVEN");
    console.log("====================================================");
}

function cleanup() {
    if (fs.existsSync(VIOLATION_DIR)) {
        console.log("[Cleanup] Removing injected violation...");
        fs.rmdirSync(VIOLATION_DIR);
    }
}

test();
