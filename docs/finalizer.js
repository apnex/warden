const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolve, ENGINE_ROOT, TARGET_ROOT } = require('../engine/path_resolver');

function calculateNextVersion(current, type) {
    const parts = current.split('.').map(Number);
    if (type === '--major') {
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
    } else if (type === '--minor') {
        parts[1]++;
        parts[2] = 0;
    } else {
        parts[2]++;
    }
    return parts.join('.');
}

function finalize() {
    let args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("[Error] No change descriptions provided.");
        console.log('Usage: node tools/finalizer.js [--gov] [--major|--minor|--patch] "Change 1" "Change 2" ...');
        process.exit(1);
    }

    let isGov = false;
    if (args[0] === '--gov') {
        isGov = true;
        args.shift();
    }

    let versionType = '--patch';
    if (['--major', '--minor', '--patch'].includes(args[0])) {
        versionType = args.shift();
    }

    if (args.length === 0) {
        console.error("[Error] No change descriptions provided.");
        process.exit(1);
    }

    const historyKey = isGov ? 'governance_changelog' : 'warden_changelog';
    const legacyPath = isGov ? resolve.engine_root('history', 'governance_changelog.json') : resolve.anchor('changelog.json');
    const changelogPath = isGov ? resolve.registry('governance.json') : resolve.registry('changelog.json');

    let history;

    // --- Migration Logic ---
    if (!fs.existsSync(changelogPath) && fs.existsSync(legacyPath)) {
        console.log(`[System] Migrating legacy history to registry domain...`);
        const parentDir = path.dirname(changelogPath);
        if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
        fs.renameSync(legacyPath, changelogPath);
    }

    // --- Hardened Loading ---
    if (fs.existsSync(changelogPath)) {
        try {
            history = JSON.parse(fs.readFileSync(changelogPath, 'utf8'));
        } catch (e) {
            console.error(`[Error] Corrupt changelog detected at ${changelogPath}. Aborting.`);
            process.exit(1);
        }
    } else {
        console.log(`[System] No ${isGov ? 'Governance' : 'Project'} history found. Initializing baseline...`);
        const parentDir = path.dirname(changelogPath);
        if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
        
        history = { [historyKey]: [{ version: "0.0.0", date: new Date().toISOString().split('T')[0], changes: ["Baseline Initialized"] }] };
    }

    const currentVersion = history[historyKey][0].version;
    const nextVersion = calculateNextVersion(currentVersion, versionType);

    const execEnv = { 
        ...process.env, 
        WARDEN_ENGINE_ROOT: ENGINE_ROOT, 
        WARDEN_TARGET_ROOT: TARGET_ROOT 
    };

    console.log("[System] Executing Protocol Integrity Gate...");
    try {
        const protocolsDir = resolve.registry('protocols');
        if (fs.existsSync(protocolsDir)) {
            execSync("node " + resolve.validation('audit_library.js') + " --sync", { stdio: 'inherit', env: execEnv });
            execSync("node " + resolve.validation('verify_integrity.js') + " --snapshot", { stdio: 'inherit', env: execEnv });
        }
        execSync("node " + resolve.validation('verify_integrity.js') + " --verify", { stdio: 'inherit', env: execEnv });
    } catch (e) {
        console.error("[Error] Integrity check failed. Finalization aborted.");
        process.exit(1);
    }

    const newEntry = {
        version: nextVersion,
        date: new Date().toISOString().split('T')[0],
        changes: args
    };

    history[historyKey].unshift(newEntry);
    fs.writeFileSync(changelogPath, JSON.stringify(history, null, 2));
    console.log("[Success] Updated " + (isGov ? 'Governance' : 'Project') + " changelog to v" + nextVersion + " (" + versionType.replace('--', '') + ")");

    console.log("[System] Synchronizing artifacts...");
    try {
        const targetDocsDir = resolve.docs();
        if (!fs.existsSync(targetDocsDir)) {
            fs.mkdirSync(targetDocsDir, { recursive: true });
            console.log("  [✅] Created target docs directory: " + path.relative(TARGET_ROOT, targetDocsDir));
        }

        const docGenerators = [
            'generate_readme.js',
            'generate_protocols.js',
            'generate_knowledge.js',
            'generate_glossary.js',
            'generate_standards.js',
            'generate_backlog.js',
            'generate_changelog.js'
        ];

        docGenerators.forEach(gen => {
            const genPath = resolve.sys_docs(gen);
            if (fs.existsSync(genPath)) {
                execSync("node " + genPath, { stdio: 'inherit', env: execEnv });
            }
        });
        console.log("[Success] All artifacts synchronized.");
    } catch (e) {
        console.error("[Error] Synchronization failed:", e.message);
        process.exit(1);
    }
}

finalize();
