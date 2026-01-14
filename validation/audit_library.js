const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { SOURCES, ROOT, resolve } = require('../engine/path_resolver');

function getHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}

function sync() {
    console.log("🛡️ [LIBRARY AUDITOR] Synchronizing Modular Registry...");

    if (!fs.existsSync(SOURCES.PROTOCOLS_INDEX)) {
        console.error("  [❌] Error: Library Spine (index.json) missing.");
        process.exit(1);
    }

    const index = JSON.parse(fs.readFileSync(SOURCES.PROTOCOLS_INDEX, 'utf8'));
    const manifest = {};
    const fullLibrary = { ...index, protocol_library: {} };

    const files = fs.readdirSync(SOURCES.PROTOCOLS_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

    files.forEach(file => {
        const protocolId = path.basename(file, '.json');
        const protocolPath = resolve.registry('protocols', file);
        const content = fs.readFileSync(protocolPath, 'utf8');
        const protocolData = JSON.parse(content);

        // 1. Update Full Library (Flat View)
        fullLibrary.protocol_library[protocolId] = protocolData;

        // 2. Build Manifest
        manifest[protocolId] = {
            file: path.relative(ROOT, protocolPath),
            version: protocolData.meta ? protocolData.meta.version : '0.0.0',
            hash: getHash(content),
            updated: new Date().toISOString()
        };

        console.log(`  [✅] Processed: ${protocolId} (v${manifest[protocolId].version})`);
    });

    // Write Manifest
    fs.writeFileSync(SOURCES.LIBRARY_MANIFEST, JSON.stringify(manifest, null, 2));
    console.log(`  [✅] Manifest updated: ${path.relative(ROOT, SOURCES.LIBRARY_MANIFEST)}`);

    // Write Flat protocols.json (Build Artifact)
    fs.writeFileSync(SOURCES.PROTOCOLS, JSON.stringify(fullLibrary, null, 2));
    console.log(`  [✅] Flat View updated: ${path.relative(ROOT, SOURCES.PROTOCOLS)}`);
}

function verify() {
    console.log("🛡️ [LIBRARY AUDITOR] Verifying Integrity...");
    
    if (!fs.existsSync(SOURCES.LIBRARY_MANIFEST)) {
        console.error("  [❌] Error: Manifest missing. Run --sync first.");
        process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(SOURCES.LIBRARY_MANIFEST, 'utf8'));
    let errors = 0;

    for (const [id, meta] of Object.entries(manifest)) {
        const protocolPath = resolve.root(meta.file);
        if (!fs.existsSync(protocolPath)) {
            console.error(`  [❌] Protocol ${id} missing: ${meta.file}`);
            errors++;
            continue;
        }

        const content = fs.readFileSync(protocolPath, 'utf8');
        const currentHash = getHash(content);

        if (currentHash !== meta.hash) {
            console.error(`  [❌] Fidelity Breach in ${id}!`);
            console.error(`      Expected: ${meta.hash}`);
            console.error(`      Actual:   ${currentHash}`);
            errors++;
        } else {
            console.log(`  [✅] Verified: ${id}`);
        }
    }

    if (errors > 0) {
        console.error(`\n[Audit] Failed. ${errors} integrity errors detected.`);
        process.exit(1);
    } else {
        console.log("\n[Audit] Pass. All modular components verified.");
    }
}

const [,, command] = process.argv;

switch (command) {
    case '--sync': sync(); break;
    case '--verify': verify(); break;
    default:
        console.log("Usage: node validation/audit_library.js [--sync | --verify]");
}
