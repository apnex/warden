const fs = require('fs');
const path = require('path');
const { resolve, SOURCES } = require('../engine/path_resolver');

const ROOT = resolve.root();
const ALLOWED_ROOT_DIRS = ['engine', 'registry', 'docs', 'history', 'validation', 'node_modules', '.git', '.gemini', '.warden'];
const FORBIDDEN_PATTERNS = [/node [^/]+\.js/g]; // Checks for 'node script.js' without path

function checkFileStructure() {
    console.log("[Audit] Checking STD_FILE_CONSOLIDATION...");
    const items = fs.readdirSync(ROOT);
    const violations = items.filter(item => {
        const fullPath = resolve.root(item);
        if (fs.statSync(fullPath).isDirectory()) {
            return !ALLOWED_ROOT_DIRS.includes(item);
        }
        return false;
    });

    if (violations.length > 0) {
        console.error(`  [❌] Violation: Unauthorized root directories found: ${violations.join(', ')}`);
        return false;
    }
    console.log("  [✅] PASS: Root structure consolidated.");
    return true;
}

function checkToolPaths() {
    console.log("[Audit] Checking STD_TOOL_PATHING...");
    const protocolsPath = SOURCES.PROTOCOLS;
    if (!fs.existsSync(protocolsPath)) return true;

    const content = fs.readFileSync(protocolsPath, 'utf8');
    const matches = content.match(/node [a-zA-Z0-9_]+\.js/g) || [];
    
    if (matches.length > 0) {
        console.error(`  [❌] Violation: Root-level tool calls found in protocols: ${matches.join(', ')}`);
        return false;
    }
    console.log("  [✅] PASS: All tool paths authoritative.");
    return true;
}

function runAudit() {
    console.log("\n====================================================");
    console.log("      🛡️ WARDEN GOVERNANCE: STANDARDS AUDIT");
    console.log("====================================================\n");
    
    const results = [
        checkFileStructure(),
        checkToolPaths()
    ];

    console.log("\n====================================================");
    const passed = results.every(r => r === true);
    if (!passed) process.exit(1);
}

function validateSQA(anchors) {
    console.log("[Audit] Validating SQA Anchors...");
    const attributesPath = SOURCES.ATTRIBUTES;
    if (!fs.existsSync(attributesPath)) {
        console.error("  [❌] Error: registry/attributes.json missing.");
        process.exit(1);
    }
    const registry = JSON.parse(fs.readFileSync(attributesPath, 'utf8')).system_quality_attributes;
    
    // Flatten registry for lookup
    const validAnchors = {};
    Object.entries(registry).forEach(([category, attrs]) => {
        Object.keys(attrs).forEach(key => {
            validAnchors[key] = category;
        });
    });

    const inputList = anchors.split(',').map(s => s.trim());
    const invalid = inputList.filter(a => !validAnchors[a]);

    if (invalid.length > 0) {
        console.error(`  [❌] Invalid Anchors: ${invalid.join(', ')}`);
        console.log(`  [💡] Valid Anchors: ${Object.keys(validAnchors).join(', ')}`);
        process.exit(1);
    }

    const formatted = inputList.map(a => `[${validAnchors[a]}] ${a}`).join(', ');
    console.log(`  [✅] PASS: Anchors Verified.`);
    
    // Output the Deliverable Token
    console.log(`\n[DLR_PLN_GSD] SQA Verified. SQA Anchors: ${formatted}`);
}

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args[0] === '--sqa') {
        if (!args[1]) {
            console.error("Usage: node validation/audit_standards.js --sqa \"Anchor1, Anchor2\"");
            process.exit(1);
        }
        validateSQA(args[1]);
    } else {
        runAudit();
    }
}

module.exports = { checkFileStructure, checkToolPaths };
