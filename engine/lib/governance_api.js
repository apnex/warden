const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { SOURCES, ROOT, REGISTRY, resolve } = require('../path_resolver');

class GovernanceAPI {
    constructor() {
        this.protocolsPath = SOURCES.PROTOCOLS;
        this.schemaPath = resolve.registry('schema', 'protocol.schema.json');
        this.validatorTool = resolve.validation('validate_schema.js');
        this.data = this.load();
    }

    load() {
        // Attempt Virtual Join (Modular Load)
        if (fs.existsSync(SOURCES.PROTOCOLS_INDEX)) {
            const index = JSON.parse(fs.readFileSync(SOURCES.PROTOCOLS_INDEX, 'utf8'));
            const data = { ...index, protocol_library: {} };

            // Load from manifest if exists, otherwise scan directory
            if (fs.existsSync(SOURCES.LIBRARY_MANIFEST)) {
                const manifest = JSON.parse(fs.readFileSync(SOURCES.LIBRARY_MANIFEST, 'utf8'));
                for (const [id, meta] of Object.entries(manifest)) {
                    const protocolPath = resolve.root(meta.file);
                    if (fs.existsSync(protocolPath)) {
                        data.protocol_library[id] = JSON.parse(fs.readFileSync(protocolPath, 'utf8'));
                    }
                }
            } else if (fs.existsSync(SOURCES.PROTOCOLS_DIR)) {
                // Fallback: Scan directory (Option 2: Late-Binding / Discovery)
                const files = fs.readdirSync(SOURCES.PROTOCOLS_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
                files.forEach(file => {
                    const id = path.basename(file, '.json');
                    const protocolPath = resolve.registry('protocols', file);
                    data.protocol_library[id] = JSON.parse(fs.readFileSync(protocolPath, 'utf8'));
                });
            }

            // Virtual Join: Load decoupled deliverables
            const DELIVERABLES_FILE = SOURCES.DELIVERABLES;
            if (fs.existsSync(DELIVERABLES_FILE)) {
                const delivData = JSON.parse(fs.readFileSync(DELIVERABLES_FILE, 'utf8'));
                data.deliverable_registry = delivData.deliverables;
            }

            return data;
        }

        // Fallback to legacy protocols.json
        if (!fs.existsSync(this.protocolsPath)) {
            throw new Error(`Protocols not found at ${this.protocolsPath}`);
        }
        const data = JSON.parse(fs.readFileSync(this.protocolsPath, 'utf8'));

        // Virtual Join: Load decoupled deliverables
        const DELIVERABLES_FILE = SOURCES.DELIVERABLES;
        if (fs.existsSync(DELIVERABLES_FILE)) {
            const delivData = JSON.parse(fs.readFileSync(DELIVERABLES_FILE, 'utf8'));
            data.deliverable_registry = delivData.deliverables;
        }

        return data;
    }

    getProtocol(id) {
        return this.data.protocol_library[id];
    }

    updateMeta(meta) {
        this.data.meta = { ...this.data.meta, ...meta };
        return this;
    }

    addProtocol(id, protocolData) {
        if (this.data.protocol_library[id]) {
            console.warn(`[API] Protocol ${id} already exists. Overwriting.`);
        }
        this.data.protocol_library[id] = protocolData;
        return this;
    }

    patchProtocol(id, patch) {
        if (!this.data.protocol_library[id]) {
            throw new Error(`Protocol ${id} not found.`);
        }
        // Deep merge logic (simplified for pilot)
        Object.assign(this.data.protocol_library[id], patch);
        return this;
    }

    removeProtocol(id) {
        delete this.data.protocol_library[id];
        return this;
    }

    findProtocolByTitle(title) {
        return Object.entries(this.data.protocol_library).find(([id, p]) => p.meta.title === title);
    }

    migrateActiveState(oldId, newId, stateFile) {
        if (!fs.existsSync(stateFile)) return false;
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        if (state.protocol_id === oldId) {
            state.protocol_id = newId;
            fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
            console.log(`[API] Migrated active state from ${oldId} to ${newId}`);
            return true;
        }
        return false;
    }

    validate() {
        const tmpFile = this.protocolsPath + '.tmp';
        fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2));
        try {
            // Run structural validation
            execSync(`node ${this.validatorTool} ${this.schemaPath} ${tmpFile}`, { stdio: 'pipe' });
            return true;
        } catch (e) {
            console.error(`[API] Validation Failed: ${e.stdout}\n${e.stderr}`);
            return false;
        } finally {
            if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        }
    }

    commit() {
        if (!this.validate()) {
            throw new Error("Commit aborted: Schema validation failed.");
        }

        // Modular Write (The Spine)
        if (fs.existsSync(SOURCES.PROTOCOLS_INDEX)) {
            const index = { meta: this.data.meta, bootstrap: this.data.bootstrap };
            fs.writeFileSync(SOURCES.PROTOCOLS_INDEX, JSON.stringify(index, null, 2));

            // Modular Write (The Protocols)
            for (const [id, proto] of Object.entries(this.data.protocol_library)) {
                const protocolPath = resolve.registry('protocols', `${id}.json`);
                fs.writeFileSync(protocolPath, JSON.stringify(proto, null, 2));
            }

            // Trigger Library Sync (Generates Manifest and Flat protocols.json)
            try {
                execSync(`node ${resolve.validation('audit_library.js')} --sync`, { stdio: 'inherit' });
            } catch (e) {
                console.warn("[API] Warning: Library synchronization failed.");
            }
        } else {
            // Legacy Flat Write
            fs.writeFileSync(this.protocolsPath, JSON.stringify(this.data, null, 2));
        }

        console.log(`[API] Successfully committed changes to ${path.basename(this.protocolsPath)}`);
        
        // Trigger documentation regeneration
        try {
            execSync(`node ${resolve.docs('generate_readme.js')}`, { stdio: 'inherit' });
        } catch (e) {
            console.warn("[API] Warning: Documentation sync failed.");
        }
    }
}

module.exports = { GovernanceAPI };
