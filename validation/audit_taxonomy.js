const { resolve } = require('../engine/path_resolver');
const fs = require('fs');
const path = require('path');

const DELIVERABLES_FILE = resolve.registry('deliverables.json');

function auditTaxonomy() {
    console.log("====================================================");
    console.log("      🔍 TAXONOMY AUDIT: Deliverable IDs");
    console.log("====================================================\n");

    if (!fs.existsSync(DELIVERABLES_FILE)) {
        console.error("Error: deliverables.json not found.");
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(DELIVERABLES_FILE, 'utf8'));
    const idRegex = /^DLR_[A-Z]{3}_[A-Z0-9_]+$/;
    const validKinds = new Set(['ACK', 'AUD', 'BRF', 'CRT', 'DOC', 'HND', 'KNO', 'MAN', 'MAP', 'PLN', 'PTC', 'REV', 'RPT', 'SNA', 'TRC', 'ASM']);

    let errors = 0;

    data.deliverables.forEach(d => {
        if (!idRegex.test(d.id)) {
            console.log(`[❌] ${d.id.padEnd(25)} | Status: FAIL (Invalid Format)`);
            errors++;
        } else {
            const kind = d.id.split('_')[1];
            if (!validKinds.has(kind)) {
                console.log(`[❌] ${d.id.padEnd(25)} | Status: FAIL (Unknown Kind: ${kind})`);
                errors++;
            } else {
                console.log(`[✅] ${d.id.padEnd(25)} | Status: PASS`);
            }
        }
    });

    console.log("\n----------------------------------------------------\n");
    console.log(`Audit Summary: ${errors === 0 ? "SUCCESS" : "FAILURE"}`);
    console.log(`Errors Found: ${errors}`);
    console.log("----------------------------------------------------\n");

    if (errors > 0) process.exit(1);
}

auditTaxonomy();
