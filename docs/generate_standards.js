const fs = require('fs');
const path = require('path');
const { resolve } = require('../engine/path_resolver');

function generate() {
    const nl = String.fromCharCode(10);
    const standardsFile = resolve.registry('standards.json');
    const targetFile = resolve.docs('STANDARDS.md');

    if (!fs.existsSync(standardsFile)) {
        console.error("Error: standards.json not found at " + standardsFile);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(standardsFile, 'utf8'));

    let md = '# 📜 ' + data.meta.title + nl + nl;
    md += '> ' + data.meta.description + nl + nl;
    md += 'Version: ' + data.meta.version + nl + nl;

    md += '## Registered Standards' + nl + nl;
    data.standards.forEach(s => {
        md += "### " + s.name + " (" + s.id + ")" + nl;
        md += "- **Guidance**: " + s.guidance + nl;
        md += "- **Enforcement**: " + s.enforcement + nl + nl;
    });

    md += '---' + nl + '*Generated via Warden Standards Tool*' + nl;

    fs.writeFileSync(targetFile, md);
    console.log("Success: STANDARDS.md generated.");
}

generate();
