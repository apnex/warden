const path = require('path');
const fs = require('fs');

/**
 * DETERMINISTIC PORTABLE PATH RESOLVER (V3)
 * FEAT_CLEAN_PATH_RESOLVER | IDEA-039
 */

function findEngineRoot() {
    if (process.env.WARDEN_ENGINE_ROOT && fs.existsSync(process.env.WARDEN_ENGINE_ROOT)) {
        return path.resolve(process.env.WARDEN_ENGINE_ROOT);
    }
    return path.resolve(path.join(__dirname, '..'));
}

function discoverTargetRoot(engineRoot) {
    if (process.env.WARDEN_TARGET_ROOT) return path.resolve(process.env.WARDEN_TARGET_ROOT);
    let current = process.cwd();
    while (current !== path.parse(current).root) {
        if (fs.existsSync(path.join(current, '.warden'))) return current;
        current = path.dirname(current);
    }
    return engineRoot;
}

const ENGINE_ROOT = findEngineRoot();
const TARGET_ROOT = discoverTargetRoot(ENGINE_ROOT);
const ANCHOR_ROOT = path.join(TARGET_ROOT, '.warden');

const resolve = {
    engine_root: (...parts) => path.join(ENGINE_ROOT, ...parts),
    engine: (...parts) => path.join(ENGINE_ROOT, 'engine', ...parts),
    target: (...parts) => path.join(TARGET_ROOT, ...parts),
    anchor: (...parts) => path.join(ANCHOR_ROOT, ...parts),
    
    // Context-Aware Registry Resolution (Overlay Model)
    registry: (...parts) => {
        const localPath = path.join(ANCHOR_ROOT, 'registry', ...parts);
        if (fs.existsSync(localPath)) return localPath;
        return path.join(ENGINE_ROOT, 'registry', ...parts);
    },

    // Prose Fragment Resolution (Immutable Engine Core)
    prose: (...parts) => path.join(ENGINE_ROOT, 'registry', 'prose', ...parts),
    
    // Context-Aware State Resolution
    state: (...parts) => {
        if (parts[0] === 'global') return path.join(ENGINE_ROOT, 'state', ...parts.slice(1));
        return path.join(ANCHOR_ROOT, 'state', ...parts);
    },

    // Global Engine Data (Persistent across projects)
    global: (...parts) => path.join(ENGINE_ROOT, 'state', ...parts),

    // Standard Logical Path Resolvers
    docs: (...parts) => path.join(TARGET_ROOT, 'docs', ...parts),
    sys_docs: (...parts) => path.join(ENGINE_ROOT, 'docs', ...parts),
    validation: (...parts) => path.join(ENGINE_ROOT, 'validation', ...parts),
    history: (...parts) => path.join(ANCHOR_ROOT, ...parts),
    shadow: (...parts) => path.join(ANCHOR_ROOT, 'shadow', ...parts),
    patches: (...parts) => path.join(ANCHOR_ROOT, 'patches', ...parts),

    // Active Context Proxy
    active: (type, ...parts) => {
        if (typeof resolve[type] === 'function') return resolve[type](...parts);
        return path.join(TARGET_ROOT, ...parts);
    }
};

module.exports = {
    ENGINE_ROOT,
    TARGET_ROOT,
    ANCHOR_ROOT,
    resolve
};
