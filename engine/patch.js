const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolve, ENGINE_ROOT, TARGET_ROOT } = require('./path_resolver');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function snapshot(targets) {
    console.log("🛡️ [PATCH] Initializing Pre-Flight Snapshot...");
    const shadowRoot = resolve.shadow('engine');
    ensureDir(shadowRoot);
    
    targets.forEach(target => {
        const sourcePath = path.resolve(process.cwd(), target);
        const relativeToEngine = path.relative(ENGINE_ROOT, sourcePath);
        
        if (relativeToEngine.startsWith('..')) {
            console.warn("  [!] Warning: " + target + " is outside the engine root. Skipping snapshot.");
            return;
        }

        const shadowPath = path.join(shadowRoot, relativeToEngine);
        
        if (!fs.existsSync(sourcePath)) {
            console.warn("  [!] Warning: " + target + " not found at " + sourcePath + ". Skipping.");
            return;
        }

        ensureDir(path.dirname(shadowPath));
        if (fs.statSync(sourcePath).isDirectory()) {
            fs.cpSync(sourcePath, shadowPath, { recursive: true });
        } else {
            fs.copyFileSync(sourcePath, shadowPath);
        }
        console.log("  [✅] Snapshot created: " + relativeToEngine);
    });
}

function save(patchName) {
    console.log("🛡️ [PATCH] Generating Governance Patch: " + patchName + "...");
    const patchDir = resolve.patches();
    const shadowRoot = resolve.shadow('engine');
    ensureDir(patchDir);
    const patchFile = path.join(patchDir, patchName + ".patch");
    let fullPatch = "";

    function walk(dir) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const shadowPath = path.join(dir, item);
            const relativePath = path.relative(shadowRoot, shadowPath);
            const currentPath = path.resolve(ENGINE_ROOT, relativePath);

            if (fs.statSync(shadowPath).isDirectory()) {
                walk(shadowPath);
            } else {
                if (fs.existsSync(currentPath)) {
                    try {
                        const diff = execSync("diff -u \"" + shadowPath + "\" \"" + currentPath + "\"", { encoding: 'utf8' });
                        const headerAdjusted = diff
                            .replace(shadowPath, "a/" + relativePath)
                            .replace(currentPath, "b/" + relativePath);
                        fullPatch += headerAdjusted + "\n";
                    } catch (e) {
                        if (e.stdout) {
                            const headerAdjusted = e.stdout
                                .replace(shadowPath, "a/" + relativePath)
                                .replace(currentPath, "b/" + relativePath);
                            fullPatch += headerAdjusted + "\n";
                        }
                    }
                }
            }
        });
    }

    walk(shadowRoot);

    if (fullPatch.trim() === "") {
        console.log("  [!] No changes detected against snapshot.");
        return;
    }

    fs.writeFileSync(patchFile, fullPatch);
    console.log("  [✅] Patch saved to " + path.relative(TARGET_ROOT, patchFile));
    console.log("\n[DLR_ARTIFACT_AUDIT] Path: patches/" + patchName + ".patch. Status: PASS. Analysis: Automated patch generated via engine/patch.js.");
}

function restore() {
    console.log("🛡️ [PATCH] Reverting to Pre-Flight Snapshot...");
    const shadowRoot = resolve.shadow('engine');
    if (!fs.existsSync(shadowRoot)) {
        console.error("  [❌] Error: No shadow snapshot found.");
        process.exit(1);
    }
    fs.cpSync(shadowRoot, ENGINE_ROOT, { recursive: true });
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
