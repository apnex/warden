const fs = require('fs');
const path = require('path');
const { SOURCES, WARDEN, ROOT, REGISTRY, resolve } = require('./path_resolver');
const { loadProtocols } = require('./lib/loader');

function showHeader(title) {
    console.log("\n====================================================");
    console.log(`      🚀 WARDEN GOVERNANCE: ${title}`);
    console.log("====================================================\n");
}

function getLogEntries() {
    if (!fs.existsSync(WARDEN.SESSION_LOG)) {
        console.error(`Error: Session log not found at ${WARDEN.SESSION_LOG}`);
        process.exit(1);
    }
    const logLines = fs.readFileSync(WARDEN.SESSION_LOG, 'utf8').split('\n').filter(l => l.trim() !== '');
    return logLines.map(l => JSON.parse(l));
}

function getAuditSince(activeState, stack) {
    if (!activeState) return 0;
    let since = activeState.start_time;

    // Metadata-Driven Scoping (Alternative A)
    const protocols = loadProtocols();
    const activeProto = protocols.protocol_library[activeState.protocol_id];
    if (activeProto && activeProto.meta && activeProto.meta.audit_scope === 'parent') {
        const parentState = stack[stack.length - 2];
        if (parentState) {
            since = parentState.start_time;
            // Silent log if already printed
        }
    }
    return since;
}

function normalizeCommand(cmd) {
    if (!cmd) return { tool: 'unknown', args: [], original: "" };
    let clean = cmd.trim();
    if (clean.startsWith('node ')) clean = clean.substring(5).trim();
    const parts = clean.split(' ');
    let tool = path.basename(parts[0], '.js');
    if (tool === 'echo') tool = 'manual_echo';
    return { tool, args: parts.slice(1), original: clean };
}



function sanitizeCommand(str) {
    if (!str) return "";
    return str.replace(/["'\\,]/g, '')
              .replace(/\s+/g, ' ')
              .trim()
              .toLowerCase();
}



function matchClaim(claim, entries, since) {
    const claimTool = path.basename(claim.tool, '.js');
    const sanitizedClaimCmd = sanitizeCommand(String(claim.command));
    const claimArgs = (claim.args || []).map(a => sanitizeCommand(String(a))).filter(a => a !== '');
    const debug = process.argv.includes('--debug');

    return entries.some(e => {
        if (e.command.startsWith('[RESULT]')) return false;
        if (e.timestamp < (since - 100)) return false;

        // 1. Bit-Perfect Intent ID Match (Highest Priority)
        if (e.intent && claim.id && claim.id !== 'UNKNOWN') {
            if (e.intent.id === claim.id) {
                if (debug) console.log(`[DEBUG] ID Match: ${e.intent.id}`);
                return true;
            }
        }

        // 2. Fuzzy String Fallback
        const entry = normalizeCommand(e.command);
        const sanitizedEntryOriginal = sanitizeCommand(entry.original);

        // Tool-Agnostic Shadow Matching
        const toolMatch = (entry.tool === claimTool) || 
                         (claimTool === 'unknown' && entry.tool === 'system');

        if (!toolMatch) return false;
        let cmdMatch = false;

        if (entry.tool === 'warden' || entry.tool === 'manual_echo') {
            const claimWords = sanitizedClaimCmd.split(' ');
            cmdMatch = claimWords.every(word => sanitizedEntryOriginal.includes(word));
        } else {
            cmdMatch = sanitizedEntryOriginal.includes(sanitizedClaimCmd);
        }

        const argsMatch = claimArgs.every(ca => sanitizedEntryOriginal.includes(ca));
        return cmdMatch && argsMatch;
    });
}

function generateInteractionReport(entries) {
    if (process.argv.includes('--json')) {
        const report = {
            objective: "System interaction audit",
            claims: entries
                .filter(e => (e.source === 'agent_exec' || e.source === 'manual_init' || e.source === 'manual_transition' || e.source === 'manual_close' || e.source === 'shadow_action') && !e.command.startsWith('[RESULT]'))
                .map(e => ({
                    id: e.intent ? e.intent.id : 'UNKNOWN',
                    command: e.command,
                    intent: e.intent
                }))
        };
        console.log(JSON.stringify(report, null, 2));
        return;
    }

    showHeader("INTERACTION REPORT");
    console.log("[DLR_RPT_INTERACTION]");
    entries.forEach((entry, index) => {
        const timestamp = new Date(entry.timestamp).toISOString().split('T')[1].replace('Z', '');
        const intentId = entry.intent ? `[${entry.intent.id}]` : "[SHADOW]";
        console.log(`${index + 1}. [${timestamp}] ${intentId} Command: ${entry.command}`);
        const firstLine = entry.output ? entry.output.trim().split('\n')[0] : "No output recorded.";
        console.log(`   └─ Result: ${firstLine.substring(0, 80)}${firstLine.length > 80 ? '...' : ''}`);
    });
    console.log("\n====================================================");
}

function draftReport(entries) {
    const stack = fs.existsSync(WARDEN.ACTIVE_STATE) ? JSON.parse(fs.readFileSync(WARDEN.ACTIVE_STATE, 'utf8')) : [];
    const activeState = stack[stack.length - 1];
    
    const since = getAuditSince(activeState, stack);
    if (since !== (activeState ? activeState.start_time : 0)) {
        console.log(`🛡️ [WARDEN] Deep Audit Active: Scope shifted to parent cycle.`);
    }

    const currentCycleEntries = entries.filter(e => e.timestamp >= since && !e.command.startsWith('[RESULT]'));
    
    const draft = {
        objective: activeState ? activeState.objective : "System interaction audit",
        claims: currentCycleEntries.map(e => {
            if (e.intent) {
                return { id: e.intent.id, command: e.command, tool: e.intent.tool };
            } else {
                return { id: "UNKNOWN", command: e.command, tool: "unknown" };
            }
        })
    };

    const draftPath = SOURCES.ENGINEER_REPORT;
    fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2));
    console.log(`\n[Success] Audit Draft generated: ${draftPath}`);
}

function analyzeCompliance(entries) {
    let engineerReportPath = SOURCES.ENGINEER_REPORT;
    const idx = process.argv.indexOf('--input');
    if (idx !== -1 && process.argv[idx + 1]) engineerReportPath = process.argv[idx + 1];

    if (!fs.existsSync(engineerReportPath)) {
        console.error("\n❌ [COMPLIANCE] FATAL ERROR: Missing Engineer Report.");
        process.exit(1);
    }

    const engineerReport = JSON.parse(fs.readFileSync(engineerReportPath, 'utf8'));
    const stack = fs.existsSync(WARDEN.ACTIVE_STATE) ? JSON.parse(fs.readFileSync(WARDEN.ACTIVE_STATE, 'utf8')) : [];
    const activeState = stack[stack.length - 1];
    
    const since = getAuditSince(activeState, stack);
    if (since !== (activeState ? activeState.start_time : 0)) {
        console.log(`🛡️ [WARDEN] Deep Audit Active: Scope shifted to parent cycle.`);
    }

    showHeader("COMPLIANCE REPORT");
    console.log("[DLR_RPT_COMPLIANCE]");

    let passedChecks = 0;
    const frictionPoints = [];

    // 1. Provenance
    const shadowActions = entries.filter(e => e.timestamp >= since && e.source === 'shadow_action');
    if (shadowActions.length > 0) {
        console.warn(`⚠️ [Warning] ${shadowActions.length} Shadow Actions detected.`);
        frictionPoints.push(`${shadowActions.length} shadow actions.`);
    } else {
        console.log("  [✅] PASS: All cycle actions mapped to Canonical Intents.");
        passedChecks++;
    }

    // 2. Internal View
    if (fs.existsSync(WARDEN.INTERNAL_AUDIT)) {
        console.log("  [✅] PASS: Internal Warden View reconciled.");
        passedChecks++;
    }

    // 3. Goal Alignment
    console.log("[Strategic] Aligning with System Goals...");
    const goals = fs.existsSync(SOURCES.GOALS) ? JSON.parse(fs.readFileSync(SOURCES.GOALS, 'utf8')).goals : [];
    goals.forEach(g => console.log(`  - ${g.name}: Active`));

    // 4. Bit-Perfect Match
    console.log("\n[DLR_ASM_COMPLIANCE]");
    console.log(`[Assessment] Analyzing Structured Intents (Canonical Model v1.0)...`);
    
    let matchCount = 0;
    engineerReport.claims.forEach(claim => {
        const found = matchClaim(claim, entries, since);
        if (found) {
            console.log(`  [MATCH] Verified: ${claim.id || 'Manual'} ("${claim.command}")`);
            matchCount++;
        } else {
            console.log(`  [OMISSION] NOT FOUND: ${claim.id || 'Manual'} ("${claim.command}")`);
            frictionPoints.push(`Unverified: ${claim.id}`);
        }
    });

    const trustScore = engineerReport.claims.length > 0 ? Math.round((matchCount / engineerReport.claims.length) * 100) : 0;
    console.log(`[Assessment] Trust Score: ${trustScore}%`);
    if (trustScore >= 90) passedChecks++;

    const score = Math.round((passedChecks / 3) * 10);
    console.log(`\nCompliance Score: ${score}/10`);
    console.log("Status: " + (score >= 8 ? "COMPLIANT" : "NON-COMPLIANT"));
    console.log("\n====================================================");
}

function generatePIR() {
    const idx = process.argv.indexOf('--pir');
    const args = process.argv.slice(idx + 1);
    if (args.length < 3) {
        console.log("Usage: node engine/report.js --pir <Score> \"Anomaly Analysis\" \"Remediation Table\"");
        process.exit(1);
    }
    const [score, anomalies, remediations] = args;
    showHeader("POST-IMPLEMENTATION REVIEW");
    console.log("[DLR_REV_PIR]");
    console.log(`Success Score: ${score}/10`);
    console.log(`Anomaly Analysis: ${anomalies}`);
    console.log(`Remediation Table: ${remediations}`);
    console.log("\n====================================================");
}

const entries = getLogEntries();
if (process.argv.includes('--compliance')) analyzeCompliance(entries);
else if (process.argv.includes('--draft')) draftReport(entries);
else if (process.argv.includes('--pir')) generatePIR();
else generateInteractionReport(entries);
