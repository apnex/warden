const fs = require('fs');
const path = require('path');
const { resolve } = require('../engine/path_resolver');

function generate() {
    const nl = String.fromCharCode(10);
    const kbFile = resolve.registry('knowledge_base.json');
    const targetFile = resolve.docs('KNOWLEDGE_BASE.md');

    if (!fs.existsSync(kbFile)) {
        process.exit(1);
    }

    const kb = JSON.parse(fs.readFileSync(kbFile, 'utf8'));

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

    fs.writeFileSync(targetFile, md);
    console.log('Success: KNOWLEDGE_BASE.md generated.');
}

generate();
