const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolve } = require('./path_resolver');

const ROOT = resolve.root();
const PATCH_DIR = resolve.history('patches');
const SHADOW_ROOT = resolve.shadow('engine');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function snapshot(targets) {
    console.log("🛡️ [PATCH] Initializing Pre-Flight Snapshot...");
    ensureDir(SHADOW_ROOT);
    
    targets.forEach(target => {
        const sourcePath = resolve.root(target);
        const shadowPath = resolve.shadow('engine', target);
        
        if (!fs.existsSync(sourcePath)) {
            console.warn(`  [!] Warning: ${target} not found. Skipping.`);
            return;
        }

        ensureDir(path.dirname(shadowPath));
        fs.cpSync(sourcePath, shadowPath, { recursive: true });
        console.log(`  [✅] Snapshot created: ${target}`);
    });
}

function save(patchName) {
    console.log(`🛡️ [PATCH] Generating Governance Patch: ${patchName}...`);
    ensureDir(PATCH_DIR);
    const patchFile = resolve.history('patches', `${patchName}.patch`);
    let fullPatch = "";

    // Walk shadow root to find changed files
    function walk(dir) {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const shadowPath = path.join(dir, item);
            const relativePath = path.relative(SHADOW_ROOT, shadowPath);
            const currentPath = resolve.root(relativePath);

            if (fs.statSync(shadowPath).isDirectory()) {
                walk(shadowPath);
            } else {
                if (fs.existsSync(currentPath)) {
                    try {
                        // Use diff -u for unified patch format
                        const diff = execSync(`diff -u "${shadowPath}" "${currentPath}"`, { encoding: 'utf8' });
                        // Adjust headers to look like standard patches
                        const headerAdjusted = diff
                            .replace(shadowPath, `a/${relativePath}`)
                            .replace(currentPath, `b/${relativePath}`);
                        fullPatch += headerAdjusted + "\n";
                    } catch (e) {
                        // diff returns exit code 1 if files differ
                        if (e.stdout) {
                            const headerAdjusted = e.stdout
                                .replace(shadowPath, `a/${relativePath}`)
                                .replace(currentPath, `b/${relativePath}`);
                            fullPatch += headerAdjusted + "\n";
                        }
                    }
                }
            }
        });
    }

    walk(SHADOW_ROOT);

    if (fullPatch.trim() === "") {
        console.log("  [!] No changes detected against snapshot.");
        return;
    }

    fs.writeFileSync(patchFile, fullPatch);
    console.log(`  [✅] Patch saved to ${path.relative(ROOT, patchFile)}`);
    console.log(`\n[DLR_ARTIFACT_AUDIT] Path: history/patches/${patchName}.patch. Status: PASS. Analysis: Automated patch generated via engine/patch.js.`);
}

function restore() {
    console.log("🛡️ [PATCH] Reverting to Pre-Flight Snapshot...");
    if (!fs.existsSync(SHADOW_ROOT)) {
        console.error("  [❌] Error: No shadow snapshot found.");
        process.exit(1);
    }
    fs.cpSync(SHADOW_ROOT, ROOT, { recursive: true });
    console.log("  [✅] File system restored.");
}

const [,, command, ...args] = process.argv;

switch (command) {
    case '--snapshot':
        if (args.length === 0) {
            console.error("Usage: node engine/patch.js --snapshot <targets...>");
            process.exit(1);
        }
        snapshot(args);
        break;
    case '--save':
        if (!args[0]) {
            console.error("Usage: node engine/patch.js --save <patch_name>");
            process.exit(1);
        }
        save(args[0]);
        break;
    case '--restore':
        restore();
        break;
    default:
        console.log("Usage: node engine/patch.js [--snapshot <targets> | --save <name> | --restore]");
}
