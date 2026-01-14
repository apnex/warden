const fs = require('fs');
const path = require('path');
const { SOURCES, TARGETS } = require('../engine/path_resolver');

function generate() {
    if (!fs.existsSync(SOURCES.STANDARDS)) {
        console.error("Error: standards.json not found at " + SOURCES.STANDARDS);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(SOURCES.STANDARDS, 'utf8'));
    const nl = String.fromCharCode(10);

    let md = '# 📜 ' + data.meta.title + nl + nl;
    md += '> ' + data.meta.description + nl + nl;
    md += 'Version: ' + data.meta.version + nl + nl;

    md += '## Registered Standards' + nl + nl;
    data.standards.forEach(s => {
        md += `### ${s.name} (${s.id})` + nl;
        md += `- **Guidance**: ${s.guidance}` + nl;
        md += `- **Enforcement**: ${s.enforcement}` + nl + nl;
    });

    md += '---' + nl + '*Generated via Warden Standards Tool*' + nl;

    fs.writeFileSync(TARGETS.STANDARDS_MD, md);
    console.log("Success: STANDARDS.md generated.");
}

generate();