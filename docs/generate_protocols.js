const fs = require('fs');
const path = require('path');
const { resolve, ENGINE_ROOT, TARGET_ROOT } = require('../engine/path_resolver');

function generate() {
    const nl = String.fromCharCode(10);
    const isLocalMode = (ENGINE_ROOT === TARGET_ROOT);
    
    const sourceFile = resolve.registry('protocols.json');
    const targetFile = resolve.docs('PROTOCOLS.md');
    const govChangelogFile = resolve.engine_root('history', 'governance_changelog.json');
    const onboardOutputFile = resolve.engine_root('onboarding_output.txt');

    if (!fs.existsSync(sourceFile)) {
        process.exit(1);
    }

    const root = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
    const library = root.protocol_library;

    let md = '# ' + root.meta.title + nl + nl;
    md += '**Version:** ' + root.meta.version + '  ' + nl;
    md += '**Generated:** ' + new Date().toLocaleString() + '  ' + nl + nl;
    md += '> ' + root.meta.description + nl + nl;

    if (root.bootstrap) {
        md += '## 🚀 Bootstrap' + nl;
        md += '```' + nl + root.bootstrap.instruction + nl + '```' + nl + nl;
    }

    // Only include engine-level onboarding in Local Mode
    if (isLocalMode && fs.existsSync(onboardOutputFile)) {
        md += '## 🚀 Onboarding' + nl;
        md += '> Initial system handshake and environmental validation output.' + nl + nl;
        md += '```text' + nl + fs.readFileSync(onboardOutputFile, 'utf8').trim() + nl + '```' + nl + nl;
    }

    md += '## 📑 Registry Index' + nl + nl;
    md += '| ID | Protocol Name | Version |' + nl;
    md += '|:---|:---|:---|' + nl;
    Object.entries(library).forEach(([id, p]) => {
        md += '| **' + id + '** | ' + p.meta.title + ' | v' + p.meta.version + ' |' + nl;
    });
    md += nl + '---' + nl + nl;

    if (root.deliverable_registry) {
        md += '## 📦 Deliverable Registry' + nl;
        md += '> Global authority for all system outputs.' + nl + nl;
        md += '| ID | Name | Description | Schema |' + nl;
        md += '|:---|:---|:---|:---|' + nl;
        root.deliverable_registry.forEach(dlr => {
            const schemaStr = dlr.schema ? dlr.schema.map(s => '`' + s + '`').join(', ') : '*(None)*';
            md += '| **' + dlr.id + '** | ' + dlr.name + ' | ' + dlr.description + ' | ' + schemaStr + ' |' + nl;
        });
        md += nl + '---' + nl + nl;
    }

    if (root.compliance_registry) {
        md += '## ⚖️ Compliance Framework' + nl;
        md += '> Global constraints for verified engineering cycles.' + nl + nl;
        md += '| ID | Protocol | Constraint |' + nl;
        md += '|:---|:---|:---|' + nl;
        root.compliance_registry.forEach(cmp => {
            md += '| **' + cmp.id + '** | ' + cmp.protocol + ' | ' + cmp.constraint + ' |' + nl;
        });
        md += nl + '---' + nl + nl;
    }

    Object.entries(library).forEach(([id, p]) => {
        const meta = p.meta;
        md += '# Protocol: ' + id + nl + nl;
        md += '**Title:** ' + meta.title + '  ' + nl;
        md += '**Version:** ' + meta.version + '  ' + nl + nl;
        md += '> ' + meta.description + nl + nl;

        if (meta.philosophy) {
            md += '### 🧠 Philosophy' + nl;
            md += '> ' + meta.philosophy + nl + nl;
        }

        if (meta.principles) {
            md += '### 📜 Principles' + nl;
            meta.principles.forEach(pr => md += '- ' + pr + nl);
            md += nl;
        }

        if (meta.roles) {
            md += '### 👥 Roles & Responsibilities' + nl;
            Object.entries(meta.roles).forEach(([role, data]) => {
                md += '#### ' + role + ' (' + data.designation + ')' + nl;
                data.responsibilities.forEach(r => md += '- ' + r + nl);
                md += nl;
            });
        }

        md += '## 📊 Lifecycle Flowchart' + nl + nl;
        md += '```mermaid' + nl + 'stateDiagram-v2' + nl;
        Object.entries(p.states).forEach(([stateName, stateObj]) => {
            md += '    ' + stateName + nl;
            if (stateObj.transitions) {
                Object.entries(stateObj.transitions).forEach(([trigger, trans]) => {
                    const target = typeof trans === 'string' ? trans : trans.target;
                    md += '    ' + stateName + ' --> ' + target + ' : ' + trigger + nl;
                });
            }
        });
        md += '```' + nl + nl;

        md += '## 🚦 State Definitions' + nl + nl;
        Object.entries(p.states).forEach(([stateName, stateObj]) => {
            md += '### ' + stateName + nl;
            if (stateObj.description) {
                md += '*' + stateObj.description + '*' + nl + nl;
            }

            if (stateObj.requirements && Object.keys(stateObj.requirements).length > 0) {
                md += '#### 📋 Requirements' + nl;
                md += '| ID | Type | Target | Details |' + nl;
                md += '|:---|:---|:---|:---|' + nl;
                Object.entries(stateObj.requirements).forEach(([reqId, req]) => {
                    let details = [];
                    if (req.pattern) details.push('Pattern: `' + req.pattern + '`');
                    if (req.threshold_sec) details.push('Threshold: ' + req.threshold_sec + 's');
                    if (req.freshness) details.push('Freshness Check');
                    md += '| **' + reqId + '** | `' + req.type + '` | ' + (req.target || '-') + ' | ' + details.join('<br>') + ' |' + nl;
                });
                md += nl;
            }

            if (stateObj.transitions && Object.keys(stateObj.transitions).length > 0) {
                md += '#### ➡️ Transitions' + nl;
                md += '| Trigger | Target State | 🛡️ Gated By |' + nl;
                md += '|:---|:---|:---|' + nl;
                Object.entries(stateObj.transitions).forEach(([trigger, trans]) => {
                    if (typeof trans === 'string') {
                        md += '| `' + trigger + '` | **' + trans + '** | *(None)* |' + nl;
                    } else {
                        const gates = trans.gates ? trans.gates.map(g => '`' + g + '`').join(', ') : '*(None)*';
                        md += '| `' + trigger + '` | **' + trans.target + '** | ' + gates + ' |' + nl;
                    }
                });
                md += nl;
            }
            md += '---' + nl;
        });
        md += nl + '---' + nl + nl;
    });

    // Only include Governance Evolution in Local Mode
    if (isLocalMode && fs.existsSync(govChangelogFile)) {
        const gov = JSON.parse(fs.readFileSync(govChangelogFile, 'utf8'));
        md += '## 🕒 Governance Evolution' + nl + nl;
        gov.governance_changelog.forEach(entry => {
            md += '### v' + entry.version + ' (' + entry.date + ')' + nl;
            entry.changes.forEach(c => md += '- ' + c + nl);
            md += nl;
        });
    }

    fs.writeFileSync(targetFile, md);
    console.log('Success: Protocol documentation generated.');
}

generate();
