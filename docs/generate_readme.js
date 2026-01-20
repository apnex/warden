const fs = require('fs');
const path = require('path');
const { resolve, ENGINE_ROOT, TARGET_ROOT } = require('../engine/path_resolver');

function loadProse(filename) {
    const prosePath = resolve.prose(filename);
    if (!fs.existsSync(prosePath)) return "";
    return fs.readFileSync(prosePath, 'utf8') + '\n';
}

function generate() {
    const nl = String.fromCharCode(10);
    const isLocalMode = (ENGINE_ROOT === TARGET_ROOT);
    
    const changelogFile = resolve.anchor('changelog.json');
    const targetFile = resolve.docs('README.md');

    if (isLocalMode) {
        // --- LOCAL MODE: Warden Engine Documentation ---
        const statusFile = resolve.registry('status.json');
        if (!fs.existsSync(statusFile) || !fs.existsSync(changelogFile)) {
            console.error("Missing Warden technical sources.");
            process.exit(1);
        }

        const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        const changelog = JSON.parse(fs.readFileSync(changelogFile, 'utf8'));
        const version = changelog.warden_changelog[0].version;

        let md = '# 🛡️ ' + status.tool_suite + ' - v' + status.version + nl + nl;
        md += '**Version:** ' + version + '  ' + nl;
        md += '**Generated:** ' + new Date().toLocaleString() + '  ' + nl + nl;
        
        md += '## 📋 Overview' + nl;
        md += 'The Warden Governance Engine is a high-fidelity state-machine based governance framework designed to enforce engineering standards and maintain a provable audit trail through a Zero-Knowledge (ZK) interaction model.' + nl + nl;

        md += loadProse('architecture.md');
        md += loadProse('operational_guidance.md');
        md += loadProse('integrity_model.md');
        md += loadProse('zk_agent_spec.md');

        md += '### Component Dashboard' + nl + nl;
        md += '| Component | Purpose | Status |' + nl;
        md += '|:---|:---|:---|' + nl;
        status.components.forEach(c => {
            md += '| `' + c.name + '` | ' + c.purpose + ' | **' + c.status + '** |' + nl;
        });
        md += nl + '---' + nl + nl;

        md += '## ⚙️ Core Capabilities' + nl + nl;
        status.components.filter(c => c.handlers || c.features).forEach(c => {
            md += '### ' + c.name + nl;
            if (c.handlers) {
                md += '- **Requirement Handlers:** ' + c.handlers.map(h => '`' + h + '`').join(', ') + nl;
            }
            if (c.features) {
                md += '- **Engine Features:** ' + c.features.map(f => '`' + f + '`').join(', ') + nl;
            }
            md += nl;
        });

        md += '## ⚠️ Technical Debt' + nl + nl;
        status.technical_debt.forEach(d => {
            md += '- **' + d.issue + ':** ' + d.impact + nl;
        });
        md += nl + '---' + nl + nl;

        md += '## 🕒 Version History' + nl + nl;
        changelog.warden_changelog.forEach(v => {
            md += '### v' + v.version + ' (' + v.date + ')' + nl;
            v.changes.forEach(c => md += '- ' + c + nl);
            md += nl;
        });

        md += '---' + nl + '*Generated via Warden Self-Doc Tool*' + nl;
        md += '🛡️ **Maintained by Warden Governance Engine**' + nl;

        fs.writeFileSync(targetFile, md);
        console.log('Success: Warden Technical README generated.');
    } else {
        // --- PROXY MODE: Project Governance Manifesto ---
        const projectName = path.basename(TARGET_ROOT);
        const goalsFile = resolve.registry('goals.json');
        const backlogFile = resolve.registry('backlog.json');
        const activeStateFile = resolve.state('active.json');

        const changelog = fs.existsSync(changelogFile) ? JSON.parse(fs.readFileSync(changelogFile, 'utf8')) : { warden_changelog: [{version: "0.0.0"}] };
        const version = changelog.warden_changelog[0].version;

        let md = '# 🏛️ Project Governance Manifesto: ' + projectName + nl + nl;
        md += '**Project Version:** ' + version + '  ' + nl;
        md += '**Governance Status:** ' + (fs.existsSync(activeStateFile) ? 'ACTIVE CYCLE' : 'IDLE') + '  ' + nl;
        md += '**Generated:** ' + new Date().toLocaleString() + '  ' + nl + nl;
        
        md += '## 📋 Overview' + nl;
        md += 'This project is governed by the Warden Engine. Every significant engineering decision and execution turn is captured in an immutable audit trail, ensuring high-fidelity alignment between strategic goals and technical implementation.' + nl + nl;

        md += loadProse('architecture.md');
        md += loadProse('operational_guidance.md');
        md += loadProse('integrity_model.md');

        if (fs.existsSync(goalsFile)) {
            md += '## 🎯 Strategic Goals' + nl + nl;
            const goalsData = JSON.parse(fs.readFileSync(goalsFile, 'utf8'));
            const goals = goalsData.goals || [];
            goals.forEach(g => {
                md += '### ' + g.name + ' (' + g.id + ')' + nl;
                md += g.description + nl + nl;
            });
        }

        if (fs.existsSync(backlogFile)) {
            md += '## 📋 Governance Backlog' + nl + nl;
            const backlog = JSON.parse(fs.readFileSync(backlogFile, 'utf8'));
            const openItems = (backlog.items) ? backlog.items.filter(i => i.status === 'OPEN') : [];
            if (openItems.length > 0) {
                md += '| ID | Priority | Description |' + nl;
                md += '|:---|:---|:---|' + nl;
                openItems.forEach(i => {
                    md += '| `' + i.id + '` | **' + i.priority + '** | ' + i.description + ' |' + nl;
                });
            } else {
                md += '*No open remediation items. Integrity is stable.*' + nl;
            }
            md += nl;
        }

        if (fs.existsSync(activeStateFile)) {
            const stack = JSON.parse(fs.readFileSync(activeStateFile, 'utf8'));
            const active = stack[stack.length - 1];
            md += '## 🚦 Active Governance Cycle' + nl + nl;
            md += '- **Objective:** ' + active.objective + nl;
            md += '- **Protocol:** ' + active.protocol_id + nl;
            md += '- **Current State:** ' + active.current_state + nl;
            md += '- **Cycle Depth:** ' + stack.length + nl + nl;
        }

        md += '## 📑 Governance Resources' + nl;
        md += '- [Protocol Reference](./PROTOCOLS.md)' + nl;
        md += '- [Project Changelog](./CHANGELOG.md)' + nl;
        md += '- [System Glossary](./GLOSSARY.md)' + nl;
        md += '- [Engineering Standards](./STANDARDS.md)' + nl + nl;

        md += '---' + nl + '*Generated via Warden Governance Engine*' + nl;
        md += '🛡️ **Provenance Verified**' + nl;

        fs.writeFileSync(targetFile, md);
        console.log('Success: Project Governance Manifesto generated.');
    }
}

generate();
