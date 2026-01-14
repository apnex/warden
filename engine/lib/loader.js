const fs = require('fs');
const path = require('path');
const { SOURCES, REGISTRY, resolve } = require('../path_resolver');

function loadProtocols() {
    // Attempt Virtual Join (Modular Load)
    if (fs.existsSync(SOURCES.PROTOCOLS_INDEX) && !process.env.PROTOCOL_PATH) {
        const index = JSON.parse(fs.readFileSync(SOURCES.PROTOCOLS_INDEX, 'utf8'));
        const data = { ...index, protocol_library: {} };

        // Load modular protocols
        if (fs.existsSync(SOURCES.PROTOCOLS_DIR)) {
            const files = fs.readdirSync(SOURCES.PROTOCOLS_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
            files.forEach(file => {
                const id = path.basename(file, '.json');
                const protocolPath = resolve.registry('protocols', file);
                data.protocol_library[id] = JSON.parse(fs.readFileSync(protocolPath, 'utf8'));
            });
        }

        // Virtual Join: Load decoupled deliverables
        const DELIVERABLES_FILE = resolve.registry('deliverables.json');
        if (fs.existsSync(DELIVERABLES_FILE)) {
            const delivData = JSON.parse(fs.readFileSync(DELIVERABLES_FILE, 'utf8'));
            data.deliverable_registry = delivData.deliverables;
        }

        return data;
    }

    // Fallback: Deterministic Load from SOURCES
    const PROTOCOLS_FILE = process.env.PROTOCOL_PATH || SOURCES.PROTOCOLS;
    
    if (!fs.existsSync(PROTOCOLS_FILE)) {
        console.error("Error: Protocols file missing at " + PROTOCOLS_FILE);
        process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(PROTOCOLS_FILE, 'utf8'));

    // Virtual Join: Load decoupled deliverables from SOURCES
    const DELIVERABLES_FILE = SOURCES.DELIVERABLES;
    if (fs.existsSync(DELIVERABLES_FILE)) {
        const delivData = JSON.parse(fs.readFileSync(DELIVERABLES_FILE, 'utf8'));
        data.deliverable_registry = delivData.deliverables;
    }

    return data;
}

module.exports = { loadProtocols };