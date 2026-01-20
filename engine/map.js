const fs = require('fs');
const path = require('path');
const { resolve } = require('./path_resolver');

/**
 * WARDEN CARTOGRAPHER (MAP_V2)
 * Dynamic Architecture & Protocol Topology Generator
 */

function showHeader(title) {
    console.log("%% WARDEN MAP: " + title);
    console.log("%% Generated: " + new Date().toISOString() + "\n");
}

/**
 * PHYSICAL LAYER: Dependency Mapping
 */
function getDependencies() {
    const engineDir = resolve.engine();
    const files = fs.readdirSync(engineDir).filter(f => f.endsWith('.js'));
    const deps = [];
    
    files.forEach(file => {
        const content = fs.readFileSync(path.join(engineDir, file), 'utf8');
        const matches = content.matchAll(/require\(['"](\.?\.?\/[a-zA-Z0-9_\/]+)['"]\)/g);
        for (const match of matches) {
            let depPath = match[1];
            let depName = path.basename(depPath, '.js');
            deps.push({ from: file, to: depName });
        }
    });
    return deps;
}

function renderDeps() {
    const deps = getDependencies();
    console.log("graph TD");
    console.log("  subgraph Engine");
    const nodes = new Set();
    deps.forEach(d => {
        nodes.add(d.from);
        nodes.add(d.to);
        console.log("    " + d.from.replace('.js', '') + " --> " + d.to);
    });
    console.log("  end");
}

/**
 * LOGICAL LAYER: Protocol Mapping
 */
function getProtocol(id) {
    const protoPath = resolve.registry('protocols', id + ".json");
    if (!fs.existsSync(protoPath)) {
        const fullProtocolsPath = resolve.registry('protocols.json');
        const full = JSON.parse(fs.readFileSync(fullProtocolsPath, 'utf8'));
        return full.protocol_library[id];
    }
    return JSON.parse(fs.readFileSync(protoPath, 'utf8'));
}

function renderProtocol(id) {
    const proto = getProtocol(id);
    if (!proto) {
        console.error("❌ Error: Protocol " + id + " not found.");
        process.exit(1);
    }

    console.log("graph LR");
    console.log("  subgraph " + id + " [" + proto.meta.title + "]");
    
    Object.entries(proto.states).forEach(([name, data]) => {
        if (data.type === 'initial') {
            console.log("    START(( )) --> " + name);
        }

        if (data.transitions) {
            Object.entries(data.transitions).forEach(([trigger, target]) => {
                const targetName = typeof target === 'object' ? target.target : target;
                console.log("    " + name + " -- \"" + trigger + "\" --> " + targetName);
            });
        }
    });
    console.log("  end");
}

/**
 * SYSTEM LAYER: High-Level Topology
 */
function renderSystem() {
    console.log("graph TB");
    console.log("  subgraph System [Warden Architecture]");
    console.log("    Engine --> Registry");
    console.log("    Engine --> Validation");
    console.log("    Warden[warden.js] --> Engine");
    console.log("    Warden --> Registry");
    console.log("    Validation --> Engine");
    console.log("    Validation --> Registry");
    console.log("    Registry --> Protocols[protocols.json]");
    console.log("    Registry --> Standards[standards.json]");
    console.log("    Engine --> state");
    console.log("  end");
}

const [,, command, arg] = process.argv;

switch (command) {
    case 'system':
        showHeader("System Topology");
        renderSystem();
        break;
    case 'protocol':
        if (!arg) {
            console.error("Usage: node engine/map.js protocol <ID>");
            process.exit(1);
        }
        showHeader("Protocol Flow: " + arg);
        renderProtocol(arg);
        break;
    case 'deps':
        showHeader("Code Dependencies");
        renderDeps();
        break;
    default:
        console.log("Usage: node engine/map.js [system | protocol <ID> | deps]");
}
