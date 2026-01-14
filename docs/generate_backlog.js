const fs = require('fs');
const path = require('path');
const { SOURCES, TARGETS } = require('../engine/path_resolver');

function generate() {
    if (!fs.existsSync(SOURCES.BACKLOG)) {
        console.error("Error: backlog.json not found at " + SOURCES.BACKLOG);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(SOURCES.BACKLOG, 'utf8'));
    const nl = String.fromCharCode(10);

    let md = '# 📋 ' + data.meta.title + nl + nl;
    md += '> ' + data.meta.description + nl + nl;

    // Open Items
    md += '## Open Items' + nl + nl;
    md += '| ID | Priority | Description | Created |' + nl;
    md += '|:---|:---|:---|:---|' + nl;

    const openItems = data.items.filter(i => i.status === 'OPEN');
    openItems.forEach(i => {
        md += '| `' + i.id + '` | **' + i.priority + '** | ' + i.description + ' | ' + i.created_at + ' |' + nl;
    });
    md += nl;

    // Closed Items
    md += '## Closed Items' + nl + nl;
    md += '| ID | Priority | Description | Closed |' + nl;
    md += '|:---|:---|:---|:---|' + nl;

    const closedItems = data.items.filter(i => i.status === 'CLOSED');
    closedItems.forEach(i => {
        md += '| `' + i.id + '` | **' + i.priority + '** | ' + i.description + ' | ' + (i.closed_at || i.created_at) + ' |' + nl;
    });
    md += nl;

    md += '---' + nl + '*Generated via Warden Backlog Tool*' + nl;

    fs.writeFileSync(TARGETS.BACKLOG_MD, md);
    console.log("Success: BACKLOG.md generated.");
}

generate();
