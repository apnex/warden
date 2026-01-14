const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { GovernanceAPI } = require('./lib/governance_api');
const { HANDLERS } = require('./lib/handlers');
const { WARDEN, STATE, REGISTRY, resolve } = require('./path_resolver');

const STATE_FILE = process.env.WARDEN_STATE_PATH || WARDEN.ACTIVE_STATE;
const AUDIT_FILE = process.env.WARDEN_AUDIT_PATH || WARDEN.INTERNAL_AUDIT;
const SESSION_LOG = process.env.WARDEN_LOG_PATH || WARDEN.SESSION_LOG;

// Ensure state directory exists
if (!fs.existsSync(STATE)) fs.mkdirSync(STATE, { recursive: true });

function loadStack() {
    if (!fs.existsSync(STATE_FILE)) return [];
    const content = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return Array.isArray(content) ? content : [content];
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
        audit = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
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
    fs.appendFileSync(SESSION_LOG, JSON.stringify(logEntry) + '\n');
}

function resolveIntent(command) {
    const patternsPath = resolve.registry('intent_patterns.json');
    if (!fs.existsSync(patternsPath)) return null;
    
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
    return null;
}
function getSafeProtocol(api, state) {
    let proto = api.getProtocol(state.protocol_id);
    if (!proto) {
        console.warn(`⚠️ [WARDEN] Protocol ID '${state.protocol_id}' missing. Searching for matches...`);
        const match = api.findProtocolByTitle(state.objective);
        if (match) {
            const [newId, newProto] = match;
            state.protocol_id = newId;
            proto = newProto;
        } else {
            console.error(`❌ [WARDEN] Orphaned state detected. Manual override required.`);
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

    // Telemetry Calculation
    let logCount = 0;
    if (fs.existsSync(SESSION_LOG)) {
        logCount = fs.readFileSync(SESSION_LOG, 'utf8').split('\n').filter(line => line.trim() !== '').length;
    }

    console.log(`
🛡️ [WARDEN] Active Stack Depth: ${stack.length}`);
    console.log(`🛡️ [WARDEN] Journal Telemetry: ${logCount} events logged`);
    console.log(`🛡️ [WARDEN] Active Cycle: "${state.objective}"`);
    console.log(`📜 Protocol: ${state.protocol_id} (v${proto.meta.version})`);
    console.log(`📍 Current State: ${state.current_state}`);

    let firstUnmet = null;

    if (currState.requirements) {
        console.log("📋 Requirements:");
        Object.entries(currState.requirements).forEach(([id, req]) => {
            const handler = HANDLERS[req.type];
            const result = handler ? handler(req, state) : { pass: false, error: 'Unknown handler' };
            let status = result.pass ? "[✅]" : "[❌]";
            console.log(`  ${status} ${id.padEnd(20)} | Type: ${req.type}`);
            if (req.instruction) {
                console.log(`      ℹ️  Instruction: ${req.instruction}`);
            }
            if (!result.pass && !firstUnmet) {
                firstUnmet = { id, instruction: req.instruction };
            }
        });
    }

    if (firstUnmet) {
        console.log("\n====================================================");
        console.log(`      💡 [NEXT ACTION]: ${firstUnmet.instruction || "Satisfy requirement '" + firstUnmet.id + "'"}`);
        console.log("====================================================");
    }

    if (currState.transitions) {
        console.log("\n➡️ Possible Transitions:");
        Object.entries(currState.transitions).forEach(([trigger, trans]) => {
            const target = typeof trans === 'string' ? trans : trans.target;
            console.log(`  - ${trigger.padEnd(10)} -> ${target}`);
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
    if (!proto) {
        process.exit(1);
    }
    
    let currentState = Object.keys(proto.states).find(k => proto.states[k].type === 'initial') || Object.keys(proto.states)[0];
    
    const newState = {
        protocol_id: protocolId, current_state: currentState,
        objective: objective || "No objective defined",
        start_time: Date.now(),
        last_transition: Date.now(), history: []
    };
    
    stack.push(newState);
    saveStack(stack);

    const cmdStr = `node engine/warden.js init ${protocolId} "${objective}"`;
    const intent = resolveIntent(cmdStr);
    logInteraction(cmdStr, 'manual_init', protocolId, "", intent);

    updateInternalAudit('INITIALIZE', { protocol_id: protocolId, objective: newState.objective, depth: stack.length });
    console.log(`\n🛡️ [WARDEN] Governance Initialized: ${proto.meta.title}`);
    displayStatus(stack);
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
    if (!transition) {
        process.exit(1);
    }
    const targetState = typeof transition === 'string' ? transition : transition.target;
    const nextStateData = proto.states[targetState];

    // 1. Double-Lock Handshake (Exit Gate Check)
    if (currState.interaction && currState.interaction.on_exit) {
        const exit = currState.interaction.on_exit;
        if (exit.require_external_ack) {
            const logs = fs.readFileSync(SESSION_LOG, 'utf8').split('\n').filter(l => l.trim() !== '').map(l => JSON.parse(l));
            // Corrected: Director ACKs often come via manual_echo from the Agent Turn
            const hasAck = logs.some(e => e.command.includes('_ACK') && e.timestamp > state.last_transition);
            if (!hasAck) {
                console.log(`\n🛑 [HALT] EXTERNAL ACKNOWLEDGEMENT REQUIRED 🛑`);
                console.log(`REASON: ${exit.instruction || "Director must acknowledge the deliverable before state advancement."}`);
                console.log(`\n[COGNITIVE_HALT] Present your work and await Director input.`);
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
        failures.forEach(f => console.error(`  - ${f}`));
        console.log("\n[💡] Need help with requirements? Consult the Oracle: `node engine/oracle.js list` ");
        process.exit(1);
    }
    state.history.push({ from: state.current_state, to: targetState, trigger: transitionKey, time: Date.now() });
    
    const cmdStr = `node engine/warden.js next ${transitionKey || ""}`.trim();
    const intent = resolveIntent(cmdStr);
    logInteraction(cmdStr, 'manual_transition', state.protocol_id, "", intent);

    updateInternalAudit('TRANSITION', { from: state.current_state, to: targetState });
    state.current_state = targetState; state.last_transition = Date.now();
    saveStack(stack);
    
    console.log(`\n🛡️ [WARDEN] Transition Successful. New State: ${targetState}`);

    // 2. Presentation Interjection (Entry Gate)
    if (nextStateData.interaction && nextStateData.interaction.on_enter) {
        const enter = nextStateData.interaction.on_enter;
        if (enter.banner) {
            const symbols = { STOP_REQUIRED: "🛑 [STOP]", AUDIT_MODE: "🛡️ [AUDIT]", INFO: "💡 [GUIDE]" };
            const prefix = symbols[enter.banner] || "🛡️ [WARDEN]";
            console.log(`\n${prefix} ${enter.instruction || "New Protocol State Active"} ${prefix.split(' ')[0]}`);
        }
        if (enter.oracle_topic) {
            // Internal call to explain logic without spawning process if possible, but exec is safer for consistency
            try {
                execSync(`node ${resolve.engine('oracle.js')} explain ${enter.oracle_topic}`, { stdio: 'inherit' });
            } catch (e) {}
        }
        console.log(`\n[COGNITIVE_HALT] Turn Boundary Enforced.`);
    } else {
        displayStatus(stack);
    }
}
function getContextHash() {
    if (!fs.existsSync(SESSION_LOG)) return "00000000";
    const log = fs.readFileSync(SESSION_LOG, 'utf8');
    return crypto.createHash('sha256').update(log).digest('hex').substring(0, 12);
}

function displayDeliverables(output) {
    if (output.includes('DLR_')) {
        console.log("\n✨ [WARDEN] DELIVERABLE DETECTED ✨");
        console.log("---------------------------------------------------- ");
        const lines = output.split('\n');
        lines.forEach(line => {
            if (line.includes('DLR_')) {
                let enhancedLine = line.trim();
                // Phase B: Automated ACK Signatures
                if (line.includes('_ACK')) {
                    const hash = getContextHash();
                    enhancedLine += ` | [AUTOSIGN] hash_ref: ${hash}`;
                }
                console.log(`>> ${enhancedLine}`);
            }
        });
        console.log("----------------------------------------------------\n");
    }
}

function cmdExec(command) {
    if (!command) {
        console.error("\n❌ Error: Missing command string for 'exec'.");
        process.exit(1);
    }

    const stack = loadStack();
    const state = getActiveState(stack);
    const protocolId = state ? state.protocol_id : 'none';

    // 1. Intent Classification
    const intent = resolveIntent(command);
    const isJustified = process.argv.includes('--justify');
    const justification = isJustified ? process.argv[process.argv.indexOf('--justify') + 1] : null;

    // 2. Socratic Brake (Option B)
    if (!intent && !isJustified) {
        console.log("\n====================================================");
        console.log("      🛑 WARDEN: UNKNOWN INTENT DETECTED");
        console.log("====================================================");
        console.log(`Command: "${command}"\n`);
        console.log("REASON: This command does not map to a registered Canonical Intent.");
        console.log("IMPACT: This action cannot be verified in the 3-Way Audit.\n");
        console.log("INSTRUCTION: ");
        console.log(" 1. Use 'node engine/oracle.js explain INTENT_REGISTRATION' to learn more.");
        console.log(" 2. To override, use: node engine/warden.js exec \"<cmd>\" --justify \"<Analysis>\" ");
        console.log("====================================================\n");
        process.exit(1);
    }

    if (isJustified) {
        console.log(`\n[DLR_AUD_INTERJECTION] Justification: ${justification}`);
    }

    // 3. Execution
    const source = intent ? 'agent_exec' : 'shadow_action';
    logInteraction(command, source, protocolId, "", intent);
    if (isJustified) {
        logInteraction(`JUSTIFY: ${command}`, 'manual_echo', protocolId, `[DLR_AUD_INTERJECTION] ${justification}`);
    }

    console.log(`🚀 [WARDEN] Executing Proxy: ${command}`);

    let output = "";
    try {
        output = execSync(command, { encoding: 'utf8' });
        process.stdout.write(output);
    } catch (e) {
        output = (e.stdout || "") + (e.stderr || "");
        process.stderr.write(output);
    }

    // Deliverable Amplification
    displayDeliverables(output);

    // 4. Log result to capture output for regex checks
    if (output && output.trim().length > 0) {
        logInteraction(`[RESULT] ${command}`, source, protocolId, output, intent);
    }

    console.log(`🛡️  [WARDEN] Interaction logged to journal.`);
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
                if (!res.pass) failures.push(`${id}: ${res.error}`);
            }
        });

        if (failures.length > 0) {
            console.error("\n❌ [WARDEN] Cannot close governance cycle. Unmet requirements detected:");
            failures.forEach(f => console.error(`  - ${f}`));
            process.exit(1);
        }
    }



    const protocolId = state.protocol_id;
    stack.pop();

    const cmdStr = `node engine/warden.js close`;
    const intent = resolveIntent(cmdStr);
    logInteraction(cmdStr, 'manual_close', protocolId, "", intent);

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

function cmdRemediate(flag, arg) {
    const remediatePath = resolve.engine('remediate.js');
    const cmd = `node ${remediatePath} ${flag || ""} ${arg || ""}`;
    try {
        process.stdout.write(execSync(cmd, { encoding: 'utf8' }));
    } catch (e) {
        process.stderr.write(e.stdout || e.message);
    }
}

const [,, action, arg1, arg2] = process.argv;
switch (action) {
    case 'init': cmdInit(arg1, arg2); break;
    case 'status': cmdStatus(); break;
    case 'next': cmdNext(arg1); break;
    case 'exec': cmdExec(arg1); break;
    case 'close': cmdClose(); break;
    case 'remediate': cmdRemediate(arg1, arg2); break;
    default: 
        console.log("\n🛡️  WARDEN GOVERNANCE CLI");
        console.log("---------------------------------------------------- ");
        console.log("Usage: node warden.js <command> [args]");
        console.log("\nCommands:");
        console.log("  init <proto_id> <objective>  Initialize a new governance cycle.");
        console.log("  status                       Display active protocol state.");
        console.log("  next [trigger]               Transition to the next state.");
        console.log("  exec <command_string>        Execute a command through the governance proxy.");
        console.log("  remediate <flag> [arg]       Invoke the Automated Remediation Engine.");
        console.log("  close                        Close the current governance cycle.");
        console.log("---------------------------------------------------- ");
}
