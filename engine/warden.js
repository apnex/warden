const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { GovernanceAPI } = require('./lib/governance_api');
const { HANDLERS } = require('./lib/handlers');
const { resolve, ENGINE_ROOT, TARGET_ROOT } = require('./path_resolver');

const STATE_FILE = process.env.WARDEN_STATE_PATH || resolve.state('active.json');
const AUDIT_FILE = process.env.WARDEN_AUDIT_PATH || resolve.state('internal_audit.json');
const SESSION_LOG = process.env.WARDEN_LOG_PATH || resolve.state('session.log');

// --- Configuration Management ---

const CONFIG_DEFAULTS = {
    audit_level: "normal",
    telemetry: true,
    default_author: "Engineer",
    allowed_tools: ["node", "npm", "git"]
};

function loadConfig() {
    const configPath = resolve.state('global', 'config.json');
    let config = { ...CONFIG_DEFAULTS };
    
    if (fs.existsSync(configPath)) {
        try {
            const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            config = { ...config, ...saved };
        } catch (e) {
            console.warn("⚠️ [WARDEN] Global config corrupt. Using defaults.");
        }
    }

    // Environment Overrides
    if (process.env.WARDEN_AUDIT_LEVEL) config.audit_level = process.env.WARDEN_AUDIT_LEVEL;
    if (process.env.WARDEN_TELEMETRY) config.telemetry = process.env.WARDEN_TELEMETRY === 'true';
    
    return config;
}

function saveConfig(config) {
    const configPath = resolve.state('global', 'config.json');
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// --- End Configuration Management ---

const GLOBAL_CONFIG = loadConfig();

// Ensure state directory exists (only if in a governed project context)
if (TARGET_ROOT && !fs.existsSync(resolve.state())) {
    try { fs.mkdirSync(resolve.state(), { recursive: true }); } catch (e) {}
}

function loadStack() {
    if (!fs.existsSync(STATE_FILE)) return [];
    try {
        const content = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        return Array.isArray(content) ? content : [content];
    } catch (e) { return []; }
}

function saveStack(stack) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(stack, null, 2));
}

function getActiveState(stack) {
    return stack[stack.length - 1];
}

function updateInternalAudit(action, details) {
    let audit = { history: [] };
    if (fs.existsSync(AUDIT_FILE)) {
        try { audit = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8')); } catch (e) {}
    }
    audit.history.push({ timestamp: Date.now(), action, ...details });
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(audit, null, 2));
}

function logInteraction(command, source = 'system', protocol = 'none', output = "", intent = null) {
    const logEntry = { 
        timestamp: Date.now(), 
        command, 
        output, 
        source,
        protocol,
        intent
    };
    if (fs.existsSync(path.dirname(SESSION_LOG))) {
        fs.appendFileSync(SESSION_LOG, JSON.stringify(logEntry) + '\n');
    }
}

function resolveIntent(command) {
    const patternsPath = resolve.registry('intent_patterns.json');
    if (!fs.existsSync(patternsPath)) return null;
    
    try {
        const { patterns } = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));
        for (const p of patterns) {
            const regex = new RegExp(p.regex);
            const match = command.match(regex);
            if (match) {
                const intent = { id: p.id };
                Object.entries(p.intent).forEach(([key, value]) => {
                    if (typeof value === 'string' && value.startsWith('$')) {
                        const idx = parseInt(value.substring(1));
                        intent[key] = match[idx] || null;
                    } else {
                        intent[key] = value;
                    }
                });
                return intent;
            }
        }
    } catch (e) {}
    return null;
}

function getSafeProtocol(api, state) {
    let proto = api.getProtocol(state.protocol_id);
    if (!proto) {
        console.warn("⚠️ [WARDEN] Protocol ID '" + state.protocol_id + "' missing. Searching for matches...");
        const match = api.findProtocolByTitle(state.objective);
        if (match) {
            const [newId, newProto] = match;
            state.protocol_id = newId;
            proto = newProto;
        } else {
            console.error("❌ [WARDEN] Orphaned state detected. Manual override required.");
            process.exit(1);
        }
    }
    return proto;
}

function displayStatus(stack) {
    if (!stack || stack.length === 0) { console.log("🛡️ [WARDEN] Status: IDLE"); return; }
    const state = getActiveState(stack);
    const api = new GovernanceAPI();
    const proto = getSafeProtocol(api, state);
    const currState = proto.states[state.current_state];

    let logCount = 0;
    if (fs.existsSync(SESSION_LOG)) {
        logCount = fs.readFileSync(SESSION_LOG, 'utf8').split('\n').filter(line => line.trim() !== '').length;
    }

    console.log("\n🛡️ [WARDEN] Active Stack Depth: " + stack.length);
    console.log("🛡️ [WARDEN] Journal Telemetry: " + logCount + " events logged");
    console.log("🛡️ [WARDEN] Active Cycle: \"" + state.objective + "\"");
    console.log("📜 Protocol: " + state.protocol_id + " (v" + proto.meta.version + ")");
    console.log("📍 Current State: " + state.current_state);

    let firstUnmet = null;

    if (currState.requirements) {
        console.log("📋 Requirements:");
        Object.entries(currState.requirements).forEach(([id, req]) => {
            const handler = HANDLERS[req.type];
            const result = handler ? handler(req, state) : { pass: false, error: 'Unknown handler' };
            let status = result.pass ? "[✅]" : "[❌]";
            console.log("  " + status + " " + id.padEnd(20) + " | Type: " + req.type);
            if (req.instruction) {
                console.log("      ℹ️  Instruction: " + req.instruction);
            }
            if (!result.pass && !firstUnmet) {
                firstUnmet = { id, instruction: req.instruction };
            }
        });
    }

    if (firstUnmet) {
        console.log("\n====================================================");
        console.log("      💡 [NEXT ACTION]: " + (firstUnmet.instruction || "Satisfy requirement '" + firstUnmet.id + "'"));
        console.log("====================================================");
    }

    if (currState.transitions) {
        console.log("\n➡️ Possible Transitions:");
        Object.entries(currState.transitions).forEach(([trigger, trans]) => {
            const target = typeof trans === 'string' ? trans : trans.target;
            console.log("  - " + trigger.padEnd(10) + " -> " + target);
        });
        console.log("\n[💡] node engine/oracle.js explain <TOPIC>");
    }
}

function cmdInit(protocolId, objective) {
    if (!protocolId || !objective) {
        console.error("\n❌ Error: Missing required arguments for 'init'.");
        process.exit(1);
    }
    const api = new GovernanceAPI();
    const proto = api.getProtocol(protocolId);
    const stack = loadStack();
    if (!proto) { process.exit(1); }
    
    let currentState = Object.keys(proto.states).find(k => proto.states[k].type === 'initial') || Object.keys(proto.states)[0];
    
    const newState = {
        protocol_id: protocolId, current_state: currentState,
        objective: objective || "No objective defined",
        start_time: Date.now(),
        last_transition: Date.now(), history: []
    };
    
    stack.push(newState);
    saveStack(stack);

    const cmdStr = "node engine/warden.js init " + protocolId + " \"" + objective + "\"";
    const intent = resolveIntent(cmdStr);
    logInteraction(cmdStr, 'manual_init', protocolId, "", intent);

    updateInternalAudit('INITIALIZE', { protocol_id: protocolId, objective: newState.objective, depth: stack.length });
    console.log("\n🛡️ [WARDEN] Governance Initialized: " + proto.meta.title);
    displayStatus(stack);
}

function cmdSystemInit(target) {
    const targetPath = target ? path.resolve(target) : process.cwd();
    const anchorPath = path.join(targetPath, '.warden');

    if (fs.existsSync(anchorPath) && !process.argv.includes('--force')) {
        console.error("\n❌ Error: Warden anchor already exists at " + anchorPath + ". Use --force to overwrite.");
        process.exit(1);
    }

    console.log("\n🛡️ [WARDEN] Injecting Governance Anchor into: " + targetPath);

    const dirs = ['state', 'registry', 'patches', 'shadow'];
    dirs.forEach(d => {
        const fullPath = path.join(anchorPath, d);
        if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
        console.log("  [✅] Created: .warden/" + d);
    });

    const baselineGoals = { 
        meta: { title: "Strategic Goals", description: "Strategic intent and project objectives." },
        goals: [{ id: "GOAL-001", name: "System Induction", description: "Complete the Warden onboarding and induction protocol." }] 
    };
    const baselineBacklog = { 
        meta: { title: "Project Backlog", description: "Remediation items and technical debt tracking." },
        items: [] 
    };
    const baselineChangelog = { warden_changelog: [{ version: "0.1.0", date: new Date().toISOString().split('T')[0], changes: ["Initial Governance Injection"] }] };

    fs.writeFileSync(path.join(anchorPath, 'registry', 'goals.json'), JSON.stringify(baselineGoals, null, 2));
    fs.writeFileSync(path.join(anchorPath, 'registry', 'backlog.json'), JSON.stringify(baselineBacklog, null, 2));
    fs.writeFileSync(path.join(anchorPath, 'changelog.json'), JSON.stringify(baselineChangelog, null, 2));
    console.log("  [✅] Seeded local registries.");

    const proxyPath = path.join(targetPath, 'warden');
    const proxyContent = "#!/usr/bin/env node\nconst { spawnSync } = require('child_process');\nconst path = require('path');\n\nconst ENGINE_ROOT = \"" + ENGINE_ROOT + "\";\n\nconst result = spawnSync('node', [path.join(ENGINE_ROOT, 'engine', 'warden.js'), ...process.argv.slice(2)], {\n    stdio: 'inherit',\n    env: { ...process.env, WARDEN_ENGINE_ROOT: ENGINE_ROOT, WARDEN_TARGET_ROOT: process.cwd() }\n});\n\nprocess.exit(result.status);\n";
    fs.writeFileSync(proxyPath, proxyContent, { mode: 0o755 });
    console.log("  [✅] Generated proxy executable: ./warden");

    const projectsPath = resolve.state('global', 'projects.json');
    let projects = [];
    if (fs.existsSync(projectsPath)) projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
    
    if (!projects.find(p => p.path === targetPath)) {
        projects.push({ name: path.basename(targetPath), path: targetPath, added: new Date().toISOString() });
        fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2));
        console.log("  [✅] Registered project in global engine inventory.");
    }

    console.log("\n✨ [WARDEN] Injection Complete. Project is now under governance.");
    console.log("INSTRUCTION: Run './warden status' to begin.\n");
}

function cmdSystemList() {
    const projectsPath = resolve.state('global', 'projects.json');
    if (!fs.existsSync(projectsPath)) {
        console.log("🛡️ [WARDEN] No projects registered in the fleet.");
        return;
    }
    const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
    console.log("\n🛡️  WARDEN GOVERNANCE: PROJECT FLEET");
    console.log("---------------------------------------------------- ");
    console.log("NAME".padEnd(20) + " | " + "VERSION".padEnd(10) + " | " + "STATUS".padEnd(12) + " | " + "PATH");
    console.log("---------------------------------------------------- ");
    
    projects.forEach(p => {
        const changelogFile = path.join(p.path, '.warden', 'changelog.json');
        let version = "?.?.?";
        if (fs.existsSync(changelogFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(changelogFile, 'utf8'));
                version = data.warden_changelog[0].version;
            } catch (e) {}
        }
        
        const activeFile = path.join(p.path, '.warden', 'state', 'active.json');
        const status = fs.existsSync(activeFile) ? "ACTIVE" : "IDLE";
        
        console.log(p.name.padEnd(20) + " | " + version.padEnd(10) + " | " + status.padEnd(12) + " | " + p.path);
    });
    console.log("---------------------------------------------------- \n");
}

function cmdSystemPrune() {
    const projectsPath = resolve.state('global', 'projects.json');
    if (!fs.existsSync(projectsPath)) return;
    
    let projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
    const initialCount = projects.length;
    
    projects = projects.filter(p => {
        const exists = fs.existsSync(p.path);
        if (!exists) console.log("  [PRUNE] Removing stale entry: " + p.name + " (" + p.path + ")");
        return exists;
    });
    
    if (projects.length < initialCount) {
        fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2));
        console.log("\n✨ [WARDEN] Fleet pruned. " + (initialCount - projects.length) + " entries removed.");
    } else {
        console.log("🛡️ [WARDEN] Fleet is clean. No stale entries found.");
    }
}

function cmdSystemHeartbeat() {
    const projectsPath = resolve.state('global', 'projects.json');
    if (!fs.existsSync(projectsPath)) return;
    
    const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
    console.log("\n🛡️  WARDEN FLEET HEARTBEAT");
    console.log("---------------------------------------------------- ");
    
    let healthy = 0;
    let compromised = 0;
    
    projects.forEach(p => {
        const anchor = path.join(p.path, '.warden');
        const active = path.join(anchor, 'state', 'active.json');
        
        let status = "OK";
        let color = "✅";
        
        if (!fs.existsSync(anchor)) {
            status = "ANCHOR MISSING";
            color = "❌";
            compromised++;
        } else if (fs.existsSync(active)) {
            try {
                JSON.parse(fs.readFileSync(active, 'utf8'));
                healthy++;
            } catch (e) {
                status = "STATE CORRUPT";
                color = "⚠️";
                compromised++;
            }
        } else {
            healthy++;
        }
        
        console.log("  " + color + " " + p.name.padEnd(20) + " | " + status);
    });
    
    console.log("---------------------------------------------------- ");
    console.log("Summary: " + healthy + " Healthy, " + compromised + " Compromised");
    console.log("---------------------------------------------------- \n");
}

function cmdSystemConfig(action, key, value) {
    const config = loadConfig();
    const configPath = resolve.state('global', 'config.json');

    if (action === 'list') {
        console.log("\n🛡️  WARDEN GOVERNANCE: GLOBAL CONFIG");
        console.log("Source: " + configPath);
        console.log("---------------------------------------------------- ");
        Object.entries(config).forEach(([k, v]) => {
            console.log(k.padEnd(20) + " | " + (Array.isArray(v) ? v.join(', ') : v));
        });
        console.log("---------------------------------------------------- \n");
    } else if (action === 'get') {
        if (!key) { console.error("Error: Key required."); return; }
        console.log(key + ": " + config[key]);
    } else if (action === 'set') {
        if (!key || value === undefined) { console.error("Error: Key and Value required."); return; }
        
        if (Array.isArray(config[key])) {
            config[key] = value.split(',').map(s => s.trim());
        } else if (typeof config[key] === 'boolean') {
            config[key] = value === 'true';
        } else {
            config[key] = value;
        }
        
        saveConfig(config);
        console.log("✨ [WARDEN] Global config updated: " + key + " = " + JSON.stringify(config[key]));
    } else {
        console.log("Usage: node warden.js system config <list|get|set> [key] [value]");
    }
}

function cmdSystemFactoryReset() {
    if (!process.argv.includes('--confirm')) {
        console.log("\n🛑 [WARDEN] FACTORY RESET REQUIRED 🛑");
        console.log("This action will:");
        console.log(" 1. Clear the global project inventory (projects.json).");
        console.log(" 2. Reset the global configuration to system defaults.");
        console.log(" 3. Permanently DELETE the local .warden/ anchor.");
        console.log(" 4. Remove all temporary execution logs.\n");
        console.log("INSTRUCTION: Execute with --confirm to proceed.");
        process.exit(1);
    }

    console.log("\n🛡️ [WARDEN] Initializing System Factory Reset...");

    // 1. Clear Inventory
    const projectsPath = resolve.state('global', 'projects.json');
    if (fs.existsSync(projectsPath)) {
        fs.writeFileSync(projectsPath, JSON.stringify([], null, 2));
        console.log("  [✅] Global project inventory cleared.");
    }

    // 2. Reset Config
    saveConfig(CONFIG_DEFAULTS);
    console.log("  [✅] Global configuration reset to defaults.");

    // 3. Purge Local Anchor
    const anchor = resolve.anchor();
    if (fs.existsSync(anchor)) {
        fs.rmSync(anchor, { recursive: true, force: true });
        console.log("  [✅] Local .warden anchor purged.");
    }

    // 4. Remove Onboarding Output
    const onboardOutput = resolve.engine_root('onboarding_output.txt');
    if (fs.existsSync(onboardOutput)) {
        fs.unlinkSync(onboardOutput);
        console.log("  [✅] Onboarding logs removed.");
    }

    console.log("\n✨ [WARDEN] Factory Reset Complete. System is ready for clean distribution.\n");
}

function cmdStatus() {
    const stack = loadStack();
    displayStatus(stack);
}

function cmdNext(trigger) {
    const stack = loadStack();
    if (stack.length === 0) { process.exit(1); }
    const state = getActiveState(stack);
    const api = new GovernanceAPI();
    const proto = getSafeProtocol(api, state);
    const currState = proto.states[state.current_state];
    const transitionKey = trigger || Object.keys(currState.transitions)[0];
    const transition = currState.transitions[transitionKey];
    if (!transition) { process.exit(1); }
    const targetState = typeof transition === 'string' ? transition : transition.target;
    const nextStateData = proto.states[targetState];

    if (currState.interaction && currState.interaction.on_exit) {
        const exit = currState.interaction.on_exit;
        if (exit.require_external_ack) {
            if (!fs.existsSync(SESSION_LOG)) {
                console.log("\n🛑 [HALT] EXTERNAL ACKNOWLEDGEMENT REQUIRED 🛑");
                process.exit(1);
            }
            const logs = fs.readFileSync(SESSION_LOG, 'utf8').split('\n').filter(l => l.trim() !== '').map(l => JSON.parse(l));
            const hasAck = logs.some(e => e.command.includes('_ACK') && e.timestamp > state.last_transition);
            if (!hasAck) {
                console.log("\n🛑 [HALT] EXTERNAL ACKNOWLEDGEMENT REQUIRED 🛑");
                console.log("REASON: " + (exit.instruction || "Director must acknowledge the deliverable before state advancement."));
                console.log("\n[COGNITIVE_HALT] Present your work and await Director input.");
                process.exit(1);
            }
        }
    }

    const gates = transition.gates || [];
    const failures = [];
    gates.forEach(gId => {
        const req = currState.requirements[gId];
        if (!req) return;
        const handler = HANDLERS[req.type];
        if (handler) {
            const res = handler(req, state);
            if (!res.pass) failures.push(res.error);
        }
    });
    if (failures.length > 0) {
        console.error("\n❌ [WARDEN] Gate check failed.");
        failures.forEach(f => console.error("  - " + f));
        process.exit(1);
    }
    state.history.push({ from: state.current_state, to: targetState, trigger: transitionKey, time: Date.now() });
    
    const cmdStr = ("node engine/warden.js next " + (transitionKey || "")).trim();
    const intent = resolveIntent(cmdStr);
    logInteraction(cmdStr, 'manual_transition', state.protocol_id, "", intent);

    updateInternalAudit('TRANSITION', { from: state.current_state, to: targetState });
    state.current_state = targetState; state.last_transition = Date.now();
    saveStack(stack);
    
    console.log("\n🛡️ [WARDEN] Transition Successful. New State: " + targetState);

    if (nextStateData.interaction && nextStateData.interaction.on_enter) {
        const enter = nextStateData.interaction.on_enter;
        if (enter.banner) {
            const symbols = { STOP_REQUIRED: "🛑 [STOP]", AUDIT_MODE: "🛡️ [AUDIT]", INFO: "💡 [GUIDE]" };
            const prefix = symbols[enter.banner] || "🛡️ [WARDEN]";
            console.log("\n" + prefix + " " + (enter.instruction || "New Protocol State Active") + " " + prefix.split(' ')[0]);
        }
        if (enter.oracle_topic) {
            try { execSync("node " + resolve.engine('oracle.js') + " explain " + enter.oracle_topic, { stdio: 'inherit' }); } catch (e) {}
        }
        console.log("\n[COGNITIVE_HALT] Turn Boundary Enforced.");
    } else {
        displayStatus(stack);
    }
}

function cmdExec(command) {
    if (!command) process.exit(1);
    const stack = loadStack();
    const state = getActiveState(stack);
    const protocolId = state ? state.protocol_id : 'none';
    const intent = resolveIntent(command);
    const isJustified = process.argv.includes('--justify');
    const justification = isJustified ? process.argv[process.argv.indexOf('--justify') + 1] : null;

    if (!intent && !isJustified) {
        console.log("\n====================================================");
        console.log("      🛑 WARDEN: UNKNOWN INTENT DETECTED");
        console.log("====================================================");
        console.log("Command: \"" + command + "\"\n");
        console.log("REASON: This command does not map to a registered Canonical Intent.");
        console.log("IMPACT: This action cannot be verified in the 3-Way Audit.\n");
        console.log("INSTRUCTION: ");
        console.log(" 1. Use 'node engine/oracle.js explain INTENT_REGISTRATION' to learn more.");
        console.log(" 2. To override, use: node engine/warden.js exec \"<cmd>\" --justify \"<Analysis>\" ");
        console.log("====================================================\n");
        process.exit(1);
    }

    let resolvedCommand = command;
    const internalTools = ['engine', 'docs', 'validation'];
    internalTools.forEach(tool => {
        const regex = new RegExp("node " + tool + "/([a-zA-Z0-9_]+\\.js)", 'g');
        resolvedCommand = resolvedCommand.replace(regex, (match, script) => {
            const localPath = path.join(process.cwd(), tool, script);
            if (!fs.existsSync(localPath)) {
                return "node " + resolve.engine_root(tool, script);
            }
            return match;
        });
    });

    const source = intent ? 'agent_exec' : 'shadow_action';
    logInteraction(command, source, protocolId, "", intent);
    if (isJustified) logInteraction("JUSTIFY: " + command, 'manual_echo', protocolId, "[DLR_AUD_INTERJECTION] " + justification);

    console.log("🚀 [WARDEN] Executing Proxy: " + resolvedCommand);
    let output = "";
    try {
        output = execSync(resolvedCommand, { 
            encoding: 'utf8',
            env: { ...process.env, WARDEN_PROXY_ACTIVE: 'true', WARDEN_ENGINE_ROOT: ENGINE_ROOT, WARDEN_TARGET_ROOT: TARGET_ROOT }
        });
        process.stdout.write(output);
    } catch (e) {
        output = (e.stdout || "") + (e.stderr || "");
        process.stderr.write(output);
    }

    if (output.includes('DLR_')) {
        console.log("\n✨ [WARDEN] DELIVERABLE DETECTED ✨");
        const lines = output.split('\n');
        lines.forEach(line => {
            if (line.includes('DLR_')) {
                let enhancedLine = line.trim();
                if (line.includes('_ACK')) enhancedLine += " | [AUTOSIGN] hash_ref: " + crypto.createHash('sha256').update(fs.readFileSync(SESSION_LOG, 'utf8')).digest('hex').substring(0, 12);
                console.log(">> " + enhancedLine);
            }
        });
    }

    if (output && output.trim().length > 0) logInteraction("[RESULT] " + command, source, protocolId, output, intent);
    console.log("🛡️  [WARDEN] Interaction logged to journal.");
}

function cmdClose() {
    const stack = loadStack();
    if (stack.length === 0) return;
    const state = getActiveState(stack);
    const api = new GovernanceAPI();
    const proto = getSafeProtocol(api, state);
    const currState = proto.states[state.current_state];

    if (currState.requirements) {
        const failures = [];
        Object.entries(currState.requirements).forEach(([id, req]) => {
            const handler = HANDLERS[req.type];
            if (handler) {
                const res = handler(req, state);
                if (!res.pass) failures.push(id + ": " + res.error);
            }
        });
        if (failures.length > 0) {
            console.error("\n❌ [WARDEN] Cannot close governance cycle. Unmet requirements detected:");
            failures.forEach(f => console.error("  - " + f));
            process.exit(1);
        }
    }

    const protocolId = state.protocol_id;
    stack.pop();
    logInteraction("node engine/warden.js close", 'manual_close', protocolId, "", resolveIntent("node engine/warden.js close"));

    if (stack.length > 0) {
        saveStack(stack);
        console.log("\n🛡️ [WARDEN] Governance Sub-Cycle Closed. Returning to Parent.");
        displayStatus(stack);
    } else {
        if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
        if (fs.existsSync(SESSION_LOG)) fs.unlinkSync(SESSION_LOG);
        if (fs.existsSync(AUDIT_FILE)) fs.unlinkSync(AUDIT_FILE);
        console.log("\n🛡️ [WARDEN] Final Governance Cycle Closed.");
    }
}

const [,, action, arg1, arg2, arg3] = process.argv;
switch (action) {
    case 'init': cmdInit(arg1, arg2); break;
    case 'status': cmdStatus(); break;
    case 'next': cmdNext(arg1); break;
    case 'exec': cmdExec(arg1); break;
    case 'close': cmdClose(); break;
    case 'system':
        if (arg1 === 'init') cmdSystemInit(arg2);
        if (arg1 === 'list') cmdSystemList();
        if (arg1 === 'prune') cmdSystemPrune();
        if (arg1 === 'heartbeat') cmdSystemHeartbeat();
        if (arg1 === 'config') cmdSystemConfig(arg2, arg3, process.argv[6]);
        if (arg1 === 'factory-reset') cmdSystemFactoryReset();
        break;
    default: 
        console.log("\n🛡️  WARDEN GOVERNANCE CLI");
        console.log("---------------------------------------------------- ");
        console.log("Usage: node warden.js <command> [args]");
        console.log("\nCommands:");
        console.log("  init <proto_id> <objective>  Initialize a new governance cycle.");
        console.log("  status                       Display active protocol state.");
        console.log("  next [trigger]               Transition to the next state.");
        console.log("  exec <command_string>        Execute a command through the governance proxy.");
        console.log("  system init [target]         Injected Warden into a target project (Anchor + Proxy).");
        console.log("  system list                  Display all projects in the fleet.");
        console.log("  system prune                 Remove stale project entries.");
        console.log("  system heartbeat             Perform a health check on the fleet.");
        console.log("  system config <list|get|set> Manage global engine configuration.");
        console.log("  system factory-reset         Wipe all state and prepare for distribution.");
        console.log("  close                        Close the current governance cycle.");
        console.log("---------------------------------------------------- ");
}
