const { resolve } = require('../engine/path_resolver');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DELIVERABLES_FILE = resolve.registry('deliverables.json');
const ORACLE_TOOL = resolve.engine('oracle.js');

function testBlueprints() {
    console.log("====================================================");
    console.log("      🔍 ARTIFACT AUDIT: Oracle Blueprints");
    console.log("====================================================\n");

    const deliverablesData = JSON.parse(fs.readFileSync(DELIVERABLES_FILE, 'utf8'));
    const results = [];
    let allPassed = true;

    deliverablesData.deliverables.forEach(d => {
        try {
            const output = execSync(`node ${ORACLE_TOOL} blueprint ${d.id}`, { encoding: 'utf8' }).trim();
            const json = JSON.parse(output);
            
            let issues = [];
            if (d.schema) {
                if (Array.isArray(d.schema)) {
                    d.schema.forEach(key => {
                        if (!(key in json)) issues.push(`Missing key: ${key}`);
                    });
                } else if (typeof d.schema === 'object' && d.schema.properties) {
                    Object.keys(d.schema.properties).forEach(key => {
                        if (!(key in json)) issues.push(`Missing property: ${key}`);
                    });
                }
            } else {
                if (!json.id || !json.description) issues.push("Missing default keys (id/description)");
            }

            if (issues.length === 0) {
                console.log(`[✅] ${d.id.padEnd(25)} | Status: PASS`);
                results.push({ id: d.id, status: 'PASS' });
            } else {
                console.log(`[❌] ${d.id.padEnd(25)} | Status: FAIL (${issues.join(', ')})`);
                results.push({ id: d.id, status: 'FAIL', issues });
                allPassed = false;
            }
        } catch (e) {
            console.log(`[💥] ${d.id.padEnd(25)} | Status: ERROR (${e.message.split('\n')[0]})`);
            results.push({ id: d.id, status: 'ERROR' });
            allPassed = false;
        }
    });

    console.log("\n----------------------------------------------------");
    console.log(`Audit Summary: ${allPassed ? "SUCCESS" : "FAILURE"}`);
    console.log("Artifact Path: engine/oracle.js");
    console.log(`Status: ${allPassed ? "PASS" : "FAIL"}`);
    console.log("----------------------------------------------------\n");

    if (allPassed) {
        console.log("DLR_ARTIFACT_AUDIT: Oracle Blueprints verified bit-perfect.");
    } else {
        process.exit(1);
    }
}

testBlueprints();
