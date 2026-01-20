const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolve, ENGINE_ROOT } = require('../path_resolver');

/**
 * GOVERNANCE API (V3)
 * Supports IDEA-039 Decoupled Registry Hierarchy
 */
class GovernanceAPI {
    constructor() {
        // Protocols are pinned to the Engine Root
        this.protocolsPath = resolve.registry('protocols.json');
        this.schemaPath = resolve.registry('schema', 'protocol.schema.json');
        this.validatorTool = resolve.validation('validate_schema.js');
        this.data = this.load();
    }

    /**
     * Loads the unified registry state (Engine + Project Overlay)
     */
    load() {
        const protocolsIndex = resolve.registry('protocols', 'index.json');
        const protocolsDir = resolve.registry('protocols');
        
        let index = { protocol_library: {}, deliverable_registry: {} };
        if (fs.existsSync(protocolsIndex)) {
            index = JSON.parse(fs.readFileSync(protocolsIndex, 'utf8'));
        }
        
        const data = { ...index, protocol_library: {} };

        if (fs.existsSync(protocolsDir)) {
            const files = fs.readdirSync(protocolsDir).filter(f => f.endsWith('.json') && f !== 'index.json');
            files.forEach(file => {
                const id = path.basename(file, '.json');
                const protocolPath = path.join(protocolsDir, file);
                data.protocol_library[id] = JSON.parse(fs.readFileSync(protocolPath, 'utf8'));
            });
        }

        const DELIVERABLES_FILE = resolve.registry('deliverables.json');
        if (fs.existsSync(DELIVERABLES_FILE)) {
            const delivData = JSON.parse(fs.readFileSync(DELIVERABLES_FILE, 'utf8'));
            data.deliverable_registry = delivData.deliverables || delivData;
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
            console.warn("[API] Protocol " + id + " already exists. Overwriting.");
        }
        this.data.protocol_library[id] = protocolData;
        return this;
    }

    patchProtocol(id, patch) {
        if (!this.data.protocol_library[id]) {
            throw new Error("Protocol " + id + " not found.");
        }
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
            console.log("[API] Migrated active state from " + oldId + " to " + newId);
            return true;
        }
        return false;
    }

    validate() {
        const tmpFile = this.protocolsPath + '.tmp';
        fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2));
        try {
            execSync("node " + this.validatorTool + " " + this.schemaPath + " " + tmpFile, { stdio: 'pipe' });
            return true;
        } catch (e) {
            console.error("[API] Validation Failed: " + e.stdout + "\n" + e.stderr);
            return false;
        } finally {
            if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        }
    }

    commit() {
        if (!this.validate()) {
            throw new Error("Commit aborted: Schema validation failed.");
        }

        const protocolsIndex = resolve.registry('protocols', 'index.json');
        const protocolsDir = resolve.registry('protocols');

        if (fs.existsSync(protocolsIndex)) {
            const index = { meta: this.data.meta, bootstrap: this.data.bootstrap };
            fs.writeFileSync(protocolsIndex, JSON.stringify(index, null, 2));

            for (const [id, proto] of Object.entries(this.data.protocol_library)) {
                const protocolPath = path.join(protocolsDir, id + ".json");
                fs.writeFileSync(protocolPath, JSON.stringify(proto, null, 2));
            }

            try {
                execSync("node " + resolve.validation('audit_library.js') + " --sync", { stdio: 'inherit' });
            } catch (e) {
                console.warn("[API] Warning: Library synchronization failed.");
            }
        } else {
            fs.writeFileSync(this.protocolsPath, JSON.stringify(this.data, null, 2));
        }

        console.log("[API] Successfully committed changes to " + path.basename(this.protocolsPath));
    }
}

module.exports = { GovernanceAPI };
