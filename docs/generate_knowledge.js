const fs = require('fs');
const path = require('path');
const { SOURCES, TARGETS } = require('../engine/path_resolver');

function generate() {
    const nl = String.fromCharCode(10);
    if (!fs.existsSync(SOURCES.KNOWLEDGE_BASE)) {
        process.exit(1);
    }

    const kb = JSON.parse(fs.readFileSync(SOURCES.KNOWLEDGE_BASE, 'utf8'));

    let md = '# 🧠 System Knowledge Base' + nl + nl;
    md += '> Persistent memory of anomalies, lessons learned, and remediations.' + nl + nl;

    md += '## 🕒 Recent Lessons' + nl + nl;
    kb.knowledge_base.slice(-10).reverse().forEach(entry => {
        md += '### ' + entry.anomaly + ' (' + entry.date + ')' + nl;
        md += '- **Cycle:** ' + entry.cycle + nl;
        md += '- **Root Cause:** ' + entry.root_cause + nl;
        md += '- **Remediations:**' + nl;
        entry.remediations.forEach(r => md += '  - ' + r + nl);
        md += nl;
    });

    md += '---' + nl + '*Generated via Knowledge Engine Tool*' + nl;

    fs.writeFileSync(TARGETS.KNOWLEDGE_BASE_MD, md);
    console.log('Success: KNOWLEDGE_BASE.md generated.');
}

generate();
