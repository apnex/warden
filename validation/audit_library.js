const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { resolve, ENGINE_ROOT } = require('../engine/path_resolver');

function getHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}

function sync() {
    console.log("🛡️ [LIBRARY AUDITOR] Synchronizing Modular Registry...");

    const protocolsIndex = resolve.registry('protocols', 'index.json');
    const protocolsDir = resolve.registry('protocols');
    const manifestFile = resolve.registry('library_manifest.json');
    const protocolsFile = resolve.registry('protocols.json');

    if (!fs.existsSync(protocolsIndex)) {
        console.error("  [❌] Error: Library Spine (index.json) missing.");
        process.exit(1);
    }

    const index = JSON.parse(fs.readFileSync(protocolsIndex, 'utf8'));
    const manifest = {};
    const fullLibrary = { ...index, protocol_library: {} };

    const files = fs.readdirSync(protocolsDir).filter(f => f.endsWith('.json') && f !== 'index.json');

    files.forEach(file => {
        const protocolId = path.basename(file, '.json');
        const protocolPath = path.join(protocolsDir, file);
        const content = fs.readFileSync(protocolPath, 'utf8');
        const protocolData = JSON.parse(content);

        fullLibrary.protocol_library[protocolId] = protocolData;

        manifest[protocolId] = {
            file: path.relative(ENGINE_ROOT, protocolPath),
            version: protocolData.meta ? protocolData.meta.version : '0.0.0',
            hash: getHash(content),
            updated: new Date().toISOString()
        };

        console.log("  [✅] Processed: " + protocolId + " (v" + manifest[protocolId].version + ")");
    });

    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    console.log("  [✅] Manifest updated: " + path.relative(ENGINE_ROOT, manifestFile));

    fs.writeFileSync(protocolsFile, JSON.stringify(fullLibrary, null, 2));
    console.log("  [✅] Flat View updated: " + path.relative(ENGINE_ROOT, protocolsFile));
}

function verify() {
    console.log("🛡️ [LIBRARY AUDITOR] Verifying Integrity...");
    
    const manifestFile = resolve.registry('library_manifest.json');
    if (!fs.existsSync(manifestFile)) {
        console.error("  [❌] Error: Manifest missing. Run --sync first.");
        process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    let errors = 0;

    for (const [id, meta] of Object.entries(manifest)) {
        const protocolPath = resolve.engine_root(meta.file);
        if (!fs.existsSync(protocolPath)) {
            console.error("  [❌] Protocol " + id + " missing: " + meta.file);
            errors++;
            continue;
        }

        const content = fs.readFileSync(protocolPath, 'utf8');
        const currentHash = getHash(content);

        if (currentHash !== meta.hash) {
            console.error("  [❌] Fidelity Breach in " + id + "!");
            console.error("      Expected: " + meta.hash);
            console.error("      Actual:   " + currentHash);
            errors++;
        } else {
            console.log("  [✅] Verified: " + id);
        }
    }

    if (errors > 0) {
        console.error("\n[Audit] Failed. " + errors + " integrity errors detected.");
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
