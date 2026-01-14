const path = require('path');
const fs = require('fs');

/**
 * DETERMINISTIC PORTABLE PATH RESOLVER
 * FEAT_PORTABLE_RESOLVER | STD_PORTABLE_PATHS
 */

function findInternalRoot() {
    // 1. Environment Priority
    if (process.env.WARDEN_ROOT && fs.existsSync(process.env.WARDEN_ROOT)) {
        return path.resolve(process.env.WARDEN_ROOT);
    }

    // 2. Anchor Discovery (Recurse upwards from __dirname to find .warden directory)
    let current = __dirname;
    while (current !== path.parse(current).root) {
        if (fs.existsSync(path.join(current, '.warden'))) {
            return current;
        }
        current = path.dirname(current);
    }

    // 3. Project Root Fallback (Assume engine/ is one level deep)
    return path.resolve(path.join(__dirname, '..'));
}

const ROOT = findInternalRoot();
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
    
    // External Target Root (Defaults to Internal Root)
    target: (...parts) => {
        const targetRoot = process.env.WARDEN_TARGET || ROOT;
        return path.join(targetRoot, ...parts);
    }
};

module.exports = {
    ROOT,
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
        BACKLOG: resolve.registry('backlog.json'),
        GOVERNANCE_CHANGELOG: resolve.history('governance_changelog.json'),
        STATUS: resolve.registry('status.json'),
        METADATA: resolve.registry('status_metadata.json'),
        CHANGELOG: resolve.registry('changelog.json'),
        ROADMAP: resolve.registry('roadmap.json'),
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
        ENGINEER_REPORT: resolve.root('engineer_report.json')
    },
    TARGETS: {
        README: resolve.docs('README.md'),
        PROTOCOLS_MD: resolve.docs('PROTOCOLS.md'),
        KNOWLEDGE_BASE_MD: resolve.docs('KNOWLEDGE_BASE.md'),
        GLOSSARY_MD: resolve.docs('GLOSSARY.md'),
        STANDARDS_MD: resolve.docs('STANDARDS.md'),
        BACKLOG_MD: resolve.docs('BACKLOG.md'),
        WARDEN_README: resolve.docs('README.md')
    },
    WARDEN: {
        ACTIVE_STATE: resolve.state('active.json'),
        INTERNAL_AUDIT: resolve.state('internal_audit.json'),
        SESSION_LOG: resolve.state('session.log'),
        ONBOARD_STATE: resolve.state('onboard.json'),
        QUIZ_CERT: resolve.state('quiz_cert.json')
    }
};
