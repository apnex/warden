const fs = require('fs');
const path = require('path');
const { resolve } = require('./path_resolver');

const BACKLOG_FILE = resolve.registry('backlog.json');

function loadBacklog() {
    if (!fs.existsSync(BACKLOG_FILE)) return null;
    return JSON.parse(fs.readFileSync(BACKLOG_FILE, 'utf8'));
}

function saveBacklog(data) {
    fs.writeFileSync(BACKLOG_FILE, JSON.stringify(data, null, 2));
}

function list() {
    const backlog = loadBacklog();
    if (!backlog) return;

    console.log("\n====================================================");
    console.log("      📋 WARDEN GOVERNANCE: BACKLOG");
    console.log("====================================================\n");
    
    const openItems = backlog.items.filter(i => i.status === 'OPEN');
    if (openItems.length === 0) {
        console.log(" (No open backlog items)");
    } else {
        openItems.sort((a, b) => a.priority.localeCompare(b.priority)).forEach(i => {
            console.log(` [${i.id}] Priority: ${i.priority}`);
            console.log(`   └─ ${i.description}`);
        });
    }
    console.log("\n====================================================");
}

function add(source, id, description, priority = 'P2') {
    const backlog = loadBacklog();
    if (!backlog) return;

    const newItem = {
        id, source, description, priority,
        status: 'OPEN',
        created_at: new Date().toISOString().split('T')[0]
    };

    backlog.items.push(newItem);
    saveBacklog(backlog);
    console.log(`[Success] Added backlog item: ${id}`);
}

function close(id) {
    const backlog = loadBacklog();
    if (!backlog) return;

    const item = backlog.items.find(i => i.id === id);
    if (!item) {
        console.error(`[Error] Backlog item ${id} not found.`);
        return;
    }

    item.status = 'CLOSED';
    item.closed_at = new Date().toISOString().split('T')[0];
    saveBacklog(backlog);
    console.log(`[Success] Closed backlog item: ${id}`);
}

const [,, cmd, arg1, arg2, arg3, arg4] = process.argv;
switch (cmd) {
    case 'list': list(); break;
    case 'add': add(arg1, arg2, arg3, arg4); break;
    case 'close': close(arg1); break;
    default: console.log("Usage: node engine/backlog.js [list|add|close]");
}
