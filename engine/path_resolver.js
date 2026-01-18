const path = require('path');
const fs = require('fs');

/**
 * DETERMINISTIC PORTABLE PATH RESOLVER
 * FEAT_PORTABLE_RESOLVER | FEAT_AUTO_CONTEXT_DISCOVERY
 */

function findInternalRoot() {
    if (process.env.WARDEN_ROOT && fs.existsSync(process.env.WARDEN_ROOT)) {
        return path.resolve(process.env.WARDEN_ROOT);
    }
    let current = __dirname;
    while (current !== path.parse(current).root) {
        if (fs.existsSync(path.join(current, '.warden'))) return current;
        current = path.dirname(current);
    }
    return path.resolve(path.join(__dirname, '..'));
}

// Discover if CWD is a governed project
function discoverActiveTarget(internalRoot) {
    if (process.env.WARDEN_TARGET) return path.resolve(process.env.WARDEN_TARGET);
    
    let current = process.cwd();
    while (current !== path.parse(current).root) {
        // A project is governed if it contains a .warden directory
        // but we must ignore the internal warden root itself to avoid recursion
        if (fs.existsSync(path.join(current, '.warden')) && current !== internalRoot) {
            return current;
        }
        current = path.dirname(current);
    }
    return internalRoot;
}

const ROOT = findInternalRoot();
const ACTIVE_ROOT = discoverActiveTarget(ROOT);

const ENGINE = path.join(ROOT, 'engine');
const REGISTRY = path.join(ROOT, 'registry');
const VALIDATION = path.join(ROOT, 'validation');
const DOCS = path.join(ROOT, 'docs');
const HISTORY = path.join(ROOT, 'history');
const STATE = path.join(ROOT, '.warden', 'state');
const SHADOW = path.join(ROOT, '.warden', 'shadow');

const resolve = {
    root: (...parts) => path.join(ROOT, ...parts),
    engine: (...parts) => path.join(ENGINE, ...parts),
    registry: (...parts) => path.join(REGISTRY, ...parts),
    docs: (...parts) => path.join(DOCS, ...parts),
    history: (...parts) => path.join(HISTORY, ...parts),
    validation: (...parts) => path.join(VALIDATION, ...parts),
    state: (...parts) => path.join(STATE, ...parts),
    shadow: (...parts) => path.join(SHADOW, ...parts),
    
    target: (...parts) => path.join(ACTIVE_ROOT, ...parts),

    active: (type, ...parts) => {
        switch(type) {
            case 'registry': return path.join(ACTIVE_ROOT, 'registry', ...parts);
            case 'docs':     return path.join(ACTIVE_ROOT, 'docs', ...parts);
            case 'history':  return path.join(ACTIVE_ROOT, 'history', ...parts);
            case 'state':    return path.join(ACTIVE_ROOT, '.warden', 'state', ...parts);
            case 'shadow':   return path.join(ACTIVE_ROOT, '.warden', 'shadow', ...parts);
            case 'root':     return path.join(ACTIVE_ROOT, ...parts);
            default:         return path.join(ACTIVE_ROOT, ...parts);
        }
    }
};

module.exports = {
    ROOT,
    ACTIVE_ROOT,
    ENGINE,
    REGISTRY,
    VALIDATION,
    DOCS,
    HISTORY,
    STATE,
    resolve,
    SOURCES: {
        PROTOCOLS: resolve.registry('protocols.json'),
        PROTOCOLS_DIR: resolve.registry('protocols'),
        PROTOCOLS_INDEX: resolve.registry('protocols', 'index.json'),
        LIBRARY_MANIFEST: resolve.registry('library_manifest.json'),
        GOALS: resolve.registry('goals.json'),
        BACKLOG: resolve.active('registry', 'backlog.json'),
        GOVERNANCE_CHANGELOG: resolve.active('history', 'governance_changelog.json'),
        STATUS: resolve.registry('status.json'),
        METADATA: resolve.registry('status_metadata.json'),
        CHANGELOG: resolve.registry('changelog.json'),
        ROADMAP: resolve.active('registry', 'roadmap.json'),
        REFACTOR_MATRIX: resolve.registry('refactor_matrix.json'),
        KNOWLEDGE_BASE: resolve.registry('knowledge_base.json'),
        GLOSSARY: resolve.registry('glossary.json'),
        STANDARDS: resolve.registry('standards.json'),
        WARDEN_STATUS: resolve.registry('status.json'),
        WARDEN_CHANGELOG: resolve.registry('changelog.json'),
        DELIVERABLES: resolve.registry('deliverables.json'),
        ATTRIBUTES: resolve.registry('attributes.json'),
        INTENT_PATTERNS: resolve.registry('intent_patterns.json'),
        QUIZ: resolve.registry('quiz.json'),
        GUIDANCE: resolve.registry('guidance.json'),
        TUTORIALS: resolve.registry('tutorials.json'),
        ENGINEER_REPORT: resolve.active('root', '.warden', 'engineer_report.json')
    },
    TARGETS: {
        README: resolve.active('docs', 'README.md'),
        PROTOCOLS_MD: resolve.active('docs', 'PROTOCOLS.md'),
        KNOWLEDGE_BASE_MD: resolve.active('docs', 'KNOWLEDGE_BASE.md'),
        GLOSSARY_MD: resolve.active('docs', 'GLOSSARY.md'),
        STANDARDS_MD: resolve.active('docs', 'STANDARDS.md'),
        BACKLOG_MD: resolve.active('docs', 'BACKLOG.md'),
        WARDEN_README: resolve.active('docs', 'README.md')
    },
    WARDEN: {
        ACTIVE_STATE: resolve.active('state', 'active.json'),
        INTERNAL_AUDIT: resolve.active('state', 'internal_audit.json'),
        SESSION_LOG: resolve.active('state', 'session.log'),
        ONBOARD_STATE: resolve.active('state', 'onboard.json'),
        QUIZ_CERT: resolve.active('state', 'quiz_cert.json')
    }
};
