const fs = require('fs');
const path = require('path');
const { resolve } = require('../path_resolver');

function loadProtocols() {
    const protocolsIndex = resolve.registry('protocols', 'index.json');
    const protocolsDir = resolve.registry('protocols');
    
    // Attempt Virtual Join (Modular Load)
    if (fs.existsSync(protocolsIndex) && !process.env.PROTOCOL_PATH) {
        const index = JSON.parse(fs.readFileSync(protocolsIndex, 'utf8'));
        const data = { ...index, protocol_library: {} };

        // Load modular protocols
        if (fs.existsSync(protocolsDir)) {
            const files = fs.readdirSync(protocolsDir).filter(f => f.endsWith('.json') && f !== 'index.json');
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

    // Fallback: Deterministic Load
    const PROTOCOLS_FILE = process.env.PROTOCOL_PATH || resolve.registry('protocols.json');
    
    if (!fs.existsSync(PROTOCOLS_FILE)) {
        console.error("Error: Protocols file missing at " + PROTOCOLS_FILE);
        process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(PROTOCOLS_FILE, 'utf8'));

    // Virtual Join: Load decoupled deliverables
    const DELIVERABLES_FILE = resolve.registry('deliverables.json');
    if (fs.existsSync(DELIVERABLES_FILE)) {
        const delivData = JSON.parse(fs.readFileSync(DELIVERABLES_FILE, 'utf8'));
        data.deliverable_registry = delivData.deliverables;
    }

    return data;
}

module.exports = { loadProtocols };
