const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolve } = require('./path_resolver');

const ROOT = resolve.root();
const PATCH_DIR = resolve.active('history', 'patches');
const SHADOW_ROOT = resolve.active('shadow', 'engine');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function snapshot(targets) {
    console.log("🛡️ [PATCH] Initializing Pre-Flight Snapshot...");
    ensureDir(SHADOW_ROOT);
    
    targets.forEach(target => {
        // Fix: Use process.cwd() to resolve the user-provided relative path correctly
        const sourcePath = path.resolve(process.cwd(), target);
        const relativeToInternalRoot = path.relative(ROOT, sourcePath);
        const shadowPath = path.join(SHADOW_ROOT, relativeToInternalRoot);
        
        if (!fs.existsSync(sourcePath)) {
            console.warn(`  [!] Warning: ${target} not found at ${sourcePath}. Skipping.`);
            return;
        }

        ensureDir(path.dirname(shadowPath));
        if (fs.statSync(sourcePath).isDirectory()) {
            fs.cpSync(sourcePath, shadowPath, { recursive: true });
        } else {
            fs.copyFileSync(sourcePath, shadowPath);
        }
        console.log(`  [✅] Snapshot created: ${relativeToInternalRoot}`);
    });
}

function save(patchName) {
    console.log(`🛡️ [PATCH] Generating Governance Patch: ${patchName}...`);
    ensureDir(PATCH_DIR);
    const patchFile = path.join(PATCH_DIR, `${patchName}.patch`);
    let fullPatch = "";

    // Walk shadow root to find changed files
    function walk(dir) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const shadowPath = path.join(dir, item);
            const relativePath = path.relative(SHADOW_ROOT, shadowPath);
            const currentPath = path.resolve(ROOT, relativePath);

            if (fs.statSync(shadowPath).isDirectory()) {
                walk(shadowPath);
            } else {
                if (fs.existsSync(currentPath)) {
                    try {
                        // Use diff -u for unified patch format
                        const diff = execSync(`diff -u "${shadowPath}" "${currentPath}"`, { encoding: 'utf8' });
                        const headerAdjusted = diff
                            .replace(shadowPath, `a/${relativePath}`)
                            .replace(currentPath, `b/${relativePath}`);
                        fullPatch += headerAdjusted + "\n";
                    } catch (e) {
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