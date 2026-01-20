const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { resolve, ENGINE_ROOT } = require('../engine/path_resolver');
const { loadProtocols } = require('../engine/lib/loader');

const SCHEMA_FILE = resolve.registry('schema', 'protocol.schema.json');
const VALIDATOR_TOOL = resolve.validation('validate_schema.js');

function getProtocolSignatures(protocolFile) {
    const protocols = loadProtocols();
    const signatures = {};
    const lib = protocols.protocol_library || {};
    
    Object.entries(lib).forEach(([id, p]) => {
        const content = JSON.stringify(p);
        let stat_count = Object.keys(p.states || {}).length;
        let req_count = 0;
        
        Object.values(p.states || {}).forEach(s => {
            req_count += Object.keys(s.requirements || {}).length;
        });

        signatures[id] = {
            hash: crypto.createHash('sha256').update(content).digest('hex'),
            version: (p.meta ? p.meta.version : '0.0.0'),
            stat_count: stat_count,
            req_count: req_count
        };
    });

    const registryContent = JSON.stringify({ deliverables: protocols.deliverable_registry, compliance: protocols.compliance_registry });
    signatures['_GLOBAL_REGISTRIES'] = { hash: crypto.createHash('sha256').update(registryContent).digest('hex'), version: '0.0.0', stat_count: 0 };
    return signatures;
}

function auditStateTransitions(protocol) {
    const errors = [];
    const states = Object.keys(protocol.states || {});
    Object.entries(protocol.states || {}).forEach(([stateName, stateObj]) => {
        if (stateObj.transitions) {
            Object.entries(stateObj.transitions).forEach(([trigger, trans]) => {
                const target = typeof trans === 'string' ? trans : trans.target;
                if (!states.includes(target)) errors.push("[Transition Error] State " + stateName + " targets non-existent state '" + target + "'");
            });
        }
    });
    return errors;
}

function auditReferentialIntegrity(protocolFile) {
    const protocols = loadProtocols();
    const registryIds = new Set([...(protocols.deliverable_registry || []).map(d => d.id), ...(protocols.compliance_registry || []).map(c => c.id)]);
    const errors = [];
    const content = JSON.stringify(protocols.protocol_library);
    const regex = /(DLR|CMP)_[A-Z0-9_]+/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        if (!registryIds.has(match[0])) errors.push("[Missing] Reference " + match[0] + " has no definition.");
    }
    Object.values(protocols.protocol_library).forEach(p => { if (p.states) errors.push(...auditStateTransitions(p)); });
    return errors;
}

function auditComponentInventory() {
    console.log("\n[SYSTEM COMPONENT INVENTORY]");
    const statusFile = resolve.registry('status.json');
    if (!fs.existsSync(statusFile)) {
        console.error("  [Error] status.json missing. Cannot audit inventory.");
        return [ "status.json missing" ];
    }
    const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    const errors = [];

    status.components.forEach(c => {
        const fullPath = path.resolve(ENGINE_ROOT, c.name);
        if (fs.existsSync(fullPath)) {
            console.log("  [✅] " + c.name.padEnd(30) + " | Status: PRESENT");
        } else {
            console.error("  [❌] " + c.name.padEnd(30) + " | Status: MISSING");
            errors.push("Component missing: " + c.name);
        }
    });
    return errors;
}

function runIntegrityForFile(protocolFile, mode) {
    const snapshotFile = protocolFile + '.integrity.snapshot.json';
    const baselineFile = protocolFile + '.baseline';
    const filename = path.basename(protocolFile);
    console.log("\n[INTEGRITY AUDIT: " + filename + " - MODE: " + mode.replace('--','').toUpperCase() + "]");
    
    if (mode === '--restore') {
        if (!fs.existsSync(baselineFile)) {
            console.error("[Error] Baseline file not found: " + baselineFile);
            return false;
        }
        fs.copyFileSync(baselineFile, protocolFile);
        console.log("[Success] Restored " + filename + " from baseline.");
    }

    if (mode === '--snapshot') {
        const sigs = getProtocolSignatures(protocolFile);
        fs.writeFileSync(snapshotFile, JSON.stringify(sigs, null, 2));
        fs.copyFileSync(protocolFile, baselineFile);
        console.log("[Success] Snapshot captured for " + filename + ".");
        return true;
    }
    try { execSync("node " + VALIDATOR_TOOL + " " + SCHEMA_FILE + " " + protocolFile, { stdio: 'inherit' }); console.log("[Schema] Validation Passed."); } 
    catch (e) { console.error("[Schema] FAILED structural validation."); return false; }
    
    const oldSigs = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
    const newSigs = getProtocolSignatures(protocolFile);
    
    const rows = [];
    let w1 = "Protocol".length, w2 = "State".length, w3 = "Fidelity Status".length;
    Object.keys(newSigs).forEach(id => {
        const old = oldSigs[id]; const curr = newSigs[id];
        let state = "UNCHANGED"; let status = "STABLE";
        if (!old) { state = "NEW"; status = "VERIFIED"; }
        else if (old.hash !== curr.hash) {
            state = "MODIFIED";
            if (curr.stat_count < old.hash_count || (curr.req_count && curr.req_count < old.req_count)) status = "⚠️ REGRESSION";
            else status = "VERIFIED";
        }
        w1 = Math.max(w1, id.length); w2 = Math.max(w2, state.length); w3 = Math.max(w3, status.length);
        rows.push({ id, state, status, regressed: status === "⚠️ REGRESSION" });
    });
    const divider = "-".repeat(w1 + w2 + w3 + 6);
    console.log(divider);
    console.log("Protocol".padEnd(w1) + " | " + "State".padEnd(w2) + " | " + "Fidelity Status".padEnd(w3));
    console.log(divider);
    let regressionDetected = false;
    rows.forEach(r => {
        console.log(r.id.padEnd(w1) + " | " + r.state.padEnd(w2) + " | " + r.status.padEnd(w3));
        if (r.regressed) regressionDetected = true;
    });
    console.log(divider);
    const refErrors = auditReferentialIntegrity(protocolFile);
    if (refErrors.length > 0) { 
        console.log("\n[REFERENTIAL INTEGRITY AUDIT]"); 
        refErrors.forEach(err => console.log("  " + err)); 
        regressionDetected = true; 
    }
    
    const invErrors = auditComponentInventory();
    if (invErrors.length > 0) { regressionDetected = true; }

    const protocolsDir = resolve.registry('protocols');
    if (fs.existsSync(protocolsDir)) {
        console.log("\n[MODULAR LIBRARY AUDIT]");
        try {
            execSync("node " + resolve.validation('audit_library.js') + " " + (mode === '--snapshot' ? '--sync' : '--verify'), { stdio: 'inherit' });
        } catch (e) {
            regressionDetected = true;
        }
    }

    return !regressionDetected;
}

function run() {
    const mode = process.argv[2] || '--verify';
    const target = process.env.PROTOCOL_PATH || resolve.registry('protocols.json');
    if (fs.existsSync(target)) {
        const passed = runIntegrityForFile(target, mode);
        if (!passed && mode === '--verify') process.exit(1);
    }
}
if (require.main === module) run();
