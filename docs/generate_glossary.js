const fs = require('fs');
const path = require('path');
const { resolve, ENGINE_ROOT, TARGET_ROOT, ANCHOR_ROOT } = require('../engine/path_resolver');

function generate() {
    const nl = String.fromCharCode(10);
    const globalGlossaryFile = path.join(ENGINE_ROOT, 'registry', 'glossary.json');
    const localGlossaryFile = path.join(ANCHOR_ROOT, 'registry', 'glossary.json');
    const targetFile = resolve.docs('GLOSSARY.md');

    let globalData = { domains: [] };
    if (fs.existsSync(globalGlossaryFile)) {
        globalData = JSON.parse(fs.readFileSync(globalGlossaryFile, 'utf8'));
    }

    let localData = { domains: [] };
    if (fs.existsSync(localGlossaryFile)) {
        localData = JSON.parse(fs.readFileSync(localGlossaryFile, 'utf8'));
    }

    let md = '# 📖 System Glossary' + nl + nl;
    md += '> Authoritative definitions for the Warden Governance ecosystem and project-specific domains.' + nl + nl;

    // Combine domains
    const domainsMap = {};
    
    globalData.domains.forEach(d => {
        domainsMap[d.id] = { ...d, source: 'Global', terms: d.terms.map(t => ({ ...t, source: 'Global' })) };
    });

    localData.domains.forEach(d => {
        if (domainsMap[d.id]) {
            // Merge terms into existing domain
            d.terms.forEach(t => {
                const existingIdx = domainsMap[d.id].terms.findIndex(et => et.uid === t.uid);
                if (existingIdx !== -1) {
                    domainsMap[d.id].terms[existingIdx] = { ...t, source: 'Local Overlay' };
                } else {
                    domainsMap[d.id].terms.push({ ...t, source: 'Local' });
                }
            });
        } else {
            domainsMap[d.id] = { ...d, source: 'Local', terms: d.terms.map(t => ({ ...t, source: 'Local' })) };
        }
    });

    Object.values(domainsMap).forEach(domain => {
        md += '## 🌐 ' + domain.id + ' Domain (' + domain.source + ')' + nl;
        md += '*' + domain.description + '*' + nl + nl;
        md += '| UID | Term | Definition | Source |' + nl;
        md += '|:---|:---|:---|:---|' + nl;

        domain.terms.forEach(t => {
            md += '| `' + t.uid + '` | **' + t.term + '** | ' + t.definition + ' | ' + (t.source || 'Global') + ' |' + nl;
        });
        md += nl;
    });

    md += '---' + nl + '*Generated via Warden Glossary Tool*' + nl;

    fs.writeFileSync(targetFile, md);
    console.log("Success: GLOSSARY.md generated (with overlays).");
}

generate();
