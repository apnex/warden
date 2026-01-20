const fs = require('fs');
const path = require('path');
const { resolve } = require('../engine/path_resolver');

function generate() {
    const nl = String.fromCharCode(10);
    const changelogFile = resolve.registry('changelog.json');
    const targetFile = resolve.docs('CHANGELOG.md');

    if (!fs.existsSync(changelogFile)) {
        console.error("Error: changelog.json not found at " + changelogFile);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(changelogFile, 'utf8'));
    const history = data.warden_changelog || data.governance_changelog || [];

    let md = '# 🕒 Project Version History' + nl + nl;
    md += '> Documentation of functional changes and governance events for this project.' + nl + nl;

    history.forEach(entry => {
        md += '## v' + entry.version + ' (' + entry.date + ')' + nl;
        if (entry.changes && entry.changes.length > 0) {
            entry.changes.forEach(c => md += '- ' + c + nl);
        } else {
            md += '- *No change descriptions provided.*' + nl;
        }
        md += nl;
    });

    md += '---' + nl + '*Generated via Warden Project Changelog Tool*' + nl;

    fs.writeFileSync(targetFile, md);
    console.log("Success: Project CHANGELOG.md generated.");
}

generate();
