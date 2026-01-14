const fs = require('fs');
const path = require('path');
const { SOURCES, TARGETS } = require('../engine/path_resolver');

function generate() {
    const nl = String.fromCharCode(10);
    if (!fs.existsSync(SOURCES.WARDEN_STATUS) || !fs.existsSync(SOURCES.WARDEN_CHANGELOG)) {
        console.error("Missing Warden technical sources.");
        process.exit(1);
    }

    const status = JSON.parse(fs.readFileSync(SOURCES.WARDEN_STATUS, 'utf8'));
    const changelog = JSON.parse(fs.readFileSync(SOURCES.WARDEN_CHANGELOG, 'utf8'));

    let md = '# 🛡️ ' + status.tool_suite + ' - v' + status.version + nl + nl;
    md += '> Technical Implementation and Architecture Documentation.' + nl + nl;

    md += '## 🧩 Component Dashboard' + nl + nl;
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
            md += '- **Handlers:** ' + c.handlers.map(h => '`' + h + '`').join(', ') + nl;
        }
        if (c.features) {
            md += '- **Features:** ' + c.features.map(f => '`' + f + '`').join(', ') + nl;
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

    fs.writeFileSync(TARGETS.WARDEN_README, md);
    console.log('Success: Warden Technical README generated.');
}

generate();
