const { GovernanceAPI } = require('./lib/governance_api');
const fs = require('fs');

function run() {
    const api = new GovernanceAPI();
    const args = process.argv.slice(2);
    const cmd = args[0];

    try {
        switch (cmd) {
            case 'add': {
                const id = args[1];
                const file = args[2];
                if (!id || !file) throw new Error("Usage: add <id> <json_file>");
                const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                api.addProtocol(id, data).commit();
                break;
            }
            case 'remove': {
                const id = args[1];
                if (!id) throw new Error("Usage: remove <id>");
                api.removeProtocol(id).commit();
                break;
            }
            case 'get': {
                const id = args[1];
                if (!id) {
                    console.log(JSON.stringify(Object.keys(api.data.protocol_library), null, 2));
                } else {
                    console.log(JSON.stringify(api.getProtocol(id), null, 2));
                }
                break;
            }
            case 'validate': {
                if (api.validate()) console.log("Protocol Library is valid.");
                break;
            }
            default:
                console.log("Warden Governance CLI (gov.js)");
                console.log("Usage: node gov.js [add|remove|get|validate]");
        }
    } catch (e) {
        console.error(`[Error] ${e.message}`);
        process.exit(1);
    }
}

run();
