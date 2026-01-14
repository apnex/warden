const fs = require('fs');
const path = require('path');
const { SOURCES, TARGETS } = require('../engine/path_resolver');

function generate() {
    if (!fs.existsSync(SOURCES.GLOSSARY)) {
        console.error("Error: glossary.json not found at " + SOURCES.GLOSSARY);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(SOURCES.GLOSSARY, 'utf8'));
    const nl = String.fromCharCode(10);

    let md = '# 📖 ' + data.meta.title + nl + nl;
    md += '> ' + data.meta.description + nl + nl;
    md += 'Version: ' + data.meta.version + nl + nl;

    data.domains.forEach(domain => {
        md += '## 🌐 ' + domain.id + ' Domain' + nl;
        md += '*' + domain.description + '*' + nl + nl;
        md += '| UID | Term | Definition | Context Usage |' + nl;
        md += '|:---|:---|:---|:---|' + nl;

        domain.terms.forEach(t => {
            md += '| `' + t.uid + '` | **' + t.term + '** | ' + t.definition + ' | ' + t.context_usage + ' |' + nl;
        });
        md += nl;
    });

    md += '---' + nl + '*Generated via Warden Glossary Tool*' + nl;

    fs.writeFileSync(TARGETS.GLOSSARY_MD, md);
    console.log("Success: GLOSSARY.md generated.");
}

generate();