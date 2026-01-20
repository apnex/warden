const fs = require('fs');
const path = require('path');
const { resolve } = require('../engine/path_resolver');

function generate() {
    const backlogFile = resolve.registry('backlog.json');
    const changelogFile = resolve.anchor('changelog.json');
    const targetFile = resolve.docs('BACKLOG.md');

    if (!fs.existsSync(backlogFile)) {
        console.error("Error: backlog.json not found at " + backlogFile);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(backlogFile, 'utf8'));
    const changelog = fs.existsSync(changelogFile) ? JSON.parse(fs.readFileSync(changelogFile, 'utf8')) : { warden_changelog: [{version: "0.0.0"}] };
    const version = changelog.warden_changelog[0].version;
    const nl = String.fromCharCode(10);

    const title = (data.meta && data.meta.title) ? data.meta.title : "Project Governance Backlog";
    const description = (data.meta && data.meta.description) ? data.meta.description : "Remediation items and technical debt tracking.";

    let md = '# 📋 ' + title + nl + nl;
    md += '**Version:** ' + version + '  ' + nl;
    md += '**Generated:** ' + new Date().toLocaleString() + '  ' + nl + nl;
    md += '> ' + description + nl + nl;

    md += '## Open Items' + nl + nl;
    md += '| ID | Priority | Description | Created |' + nl;
    md += '|:---|:---|:---|:---|' + nl;

    const openItems = data.items.filter(i => i.status === 'OPEN');
    if (openItems.length > 0) {
        openItems.forEach(i => {
            md += '| `' + i.id + '` | **' + i.priority + '** | ' + i.description + ' | ' + i.created_at + ' |' + nl;
        });
    } else {
        md += '| - | - | *No open items* | - |' + nl;
    }
    md += nl;

    md += '## Closed Items' + nl + nl;
    md += '| ID | Priority | Description | Closed |' + nl;
    md += '|:---|:---|:---|:---|' + nl;

    const closedItems = data.items.filter(i => i.status === 'CLOSED');
    if (closedItems.length > 0) {
        closedItems.forEach(i => {
            md += '| `' + i.id + '` | **' + i.priority + '** | ' + i.description + ' | ' + (i.closed_at || i.created_at) + ' |' + nl;
        });
    } else {
        md += '| - | - | *No closed items* | - |' + nl;
    }
    md += nl;

    md += '---' + nl + '*Generated via Warden Backlog Tool*' + nl;

    fs.writeFileSync(targetFile, md);
    console.log("Success: BACKLOG.md generated.");
}

generate();
