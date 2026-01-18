const fs = require('fs');
const path = require('path');
const os = require('os');
const { SOURCES, WARDEN, resolve } = require('./path_resolver');

function showHeader(title) {
    console.log("\n====================================================");
    console.log(`      🚀 WARDEN GOVERNANCE: ${title}`);
    console.log("====================================================\n");
}

function showFooter(title) {
    console.log("====================================================");
    console.log(`${title} Ready.`);
    console.log("====================================================\n");
}

function showGovernance(library, onboardProto) {
    showHeader("GOVERNANCE INDUCTION");
    console.log("--- [1/2] Protocol Briefing ---");
    console.log(`Active Baseline: System Protocol Library (v${onboardProto.meta.version || '2.0.0'})`);
    console.log(`Registry Index:  ${Object.keys(library).join(', ')}`);
    console.log(`Core Philosophy: ${onboardProto.meta.philosophy}\n`);

    console.log("--- [2/2] Handshake Deliverables ---");
    console.log("1. Core Principles Alignment");
    onboardProto.meta.principles.forEach(p => console.log(`   - ${p}`));
    
    console.log("\n2. Role Acknowledgment");
    const roles = onboardProto.meta.roles;
    Object.entries(roles).forEach(([roleId, role]) => {
        const status = roleId === 'Engineer' ? " (STATUS: PENDING)" : "";
        console.log(`   - ${roleId}: ${role.designation}${status}`);
    });
    
    console.log("\n3. Interaction & Scope");
    console.log("   - Primary Loop: GSD_V5 (Quality Engine)");
    console.log("   - Exit Gate:    PRY_V2 (Proficiency Standard)");
    console.log("   - Review Gate:  PIR_V4 (Actionable Audit)");
    console.log("   - Exec Proxy:   All audit-critical commands must be invoked via `warden.js exec` ");
    console.log("   - Authority:    protocols.json");

    console.log("\n[DLR_HND_ONBOARD] Principles Echo | Role Acceptance | Registry Mapping | Domain Awareness");

    console.log("\n⚠️  ZK FIDELITY PROTOCOL ACTIVE");
    console.log("To protect the system from 'Velocity Bias', you must first master the Prime Directives.");
    
    if (!fs.existsSync(WARDEN.ONBOARD_STATE)) {
        if (!fs.existsSync(path.dirname(WARDEN.ONBOARD_STATE))) {
            fs.mkdirSync(path.dirname(WARDEN.ONBOARD_STATE), { recursive: true });
        }
        const token = Math.random().toString(36).substring(7).toUpperCase();
        fs.writeFileSync(WARDEN.ONBOARD_STATE, JSON.stringify({ token, aligned: false }));
    }

    console.log("\n4. Next Step");
    console.log("   - Initialize Onboarding: `node engine/warden.js init ONBOARD_V4 \"System Induction\"` ");
    showFooter("Induction");
}

function showAlignment(onboardState) {
    showHeader("ZK FIDELITY ALIGNMENT");
    console.log("Status: PENDING");
    console.log(`Your Alignment Token: ${onboardState.token}`);
    console.log("\nInstructions:");
    console.log(" 1. Read the Prime Directives: `node engine/oracle.js explain PRIME_DIRECTIVES` ");
    console.log(" 2. Align your session: `node engine/onboard.js --align <token>` ");
    console.log("\nInduction is HALTED until alignment is verified.");
    showFooter("Alignment");
}

function showPledge() {
    showHeader("BEHAVIORAL PLEDGE");
    console.log("Status: REQUIRED");
    console.log("\nInstructions:");
    console.log(" 1. Review Behavioral Pledge Requirements: `node engine/oracle.js explain ZK_INTERACTION_PATTERNS` ");
    console.log(" 2. Complete the Pledge Quiz: `node engine/oracle.js quiz pledge \"ans1,ans2,ans3,ans4,ans5\"` ");
    console.log("\nInduction is HALTED until Behavioral Pledge is verified.");
    showFooter("Pledge");
}

function showProject(metadata) {
    showHeader("PROJECT ORIENTATION");
    // 1. Environmental Validation
    console.log("--- [1/3] Environmental Check ---");
    console.log(`Node.js Version: ${process.version}`);
    console.log(`Platform:        ${os.platform()}`);
    console.log("Status:          All data sources validated.\n");

    // 2. Backlog Visibility
    if (fs.existsSync(SOURCES.BACKLOG)) {
        console.log("--- 📋 Active Governance Backlog ---");
        const backlog = JSON.parse(fs.readFileSync(SOURCES.BACKLOG, 'utf8'));
        const topItems = backlog.items.filter(i => i.status === 'OPEN').slice(0, 3);
        if (topItems.length > 0) {
            topItems.forEach(i => {
                console.log(` [${i.id}] (${i.priority}): ${i.description}`);
            });
        } else {
            console.log(" (No open remediation items)");
        }
        console.log("");
    }

    // 3. Mapping Discovery
    console.log("--- [2/3] Architecture Discovery (MAP_V2) ---");
    console.log("Product Manifest Detected. Identifying Functional Domains:");
    metadata.module_overview.forEach(m => {
        console.log(` - [${m.module}]: ${m.purpose}`);
    });
    console.log("");

    // 4. Strategic Intent
    if (fs.existsSync(SOURCES.GOALS)) {
        console.log("--- [3/3] Strategic Intent (System Goals) ---");
        const goals = JSON.parse(fs.readFileSync(SOURCES.GOALS, 'utf8')).goals;
        goals.forEach(g => {
            console.log(` [${g.id}] ${g.name}: ${g.description}`);
        });
        console.log("");
    }

    // 5. Knowledge Pulse
    if (fs.existsSync(SOURCES.KNOWLEDGE_BASE)) {
        console.log("--- 🧠 System Memory (Recent Lessons) ---");
        const kb = JSON.parse(fs.readFileSync(SOURCES.KNOWLEDGE_BASE, 'utf8'));
        const recent = kb.knowledge_base.slice(-3).reverse();
        if (recent.length > 0) {
            recent.forEach(entry => {
                console.log(` [${entry.date}] Anomaly: ${entry.anomaly}`);
                console.log(`   └─ Remediation: ${entry.remediations[0]}`);
            });
        } else {
            console.log(" (Memory is currently clear)");
        }
        console.log("");
    }
    console.log("--- [STOP] ZK FIDELITY HOLD ---");
    console.log(" 1. DO NOT self-assign backlog items.");
    console.log(" 2. DO NOT modify any code.");
    console.log(" 3. AWAIT specific Directive from the Director.");
    console.log("====================================================");
    console.log("Orientation Complete. STAND BY.");
    console.log("====================================================\n");
}

function showRefresh(library) {
    showHeader("SYSTEM REFRESH");
    console.log("Protocol State Pulse:");
    Object.entries(library).forEach(([id, p]) => {
        console.log(` - ${id.padEnd(12)} | v${p.meta.version}`);
    });
    console.log("\nAction: Verify and Echo these versions in your next Survey phase.\n");
    showFooter("Refresh");
}

function getActiveState() {
    if (!fs.existsSync(WARDEN.ACTIVE_STATE)) return null;
    const stack = JSON.parse(fs.readFileSync(WARDEN.ACTIVE_STATE, 'utf8'));
    return stack.find(s => s.protocol_id === 'ONBOARD_V4');
}

async function onboard() {
    const protocols = JSON.parse(fs.readFileSync(SOURCES.PROTOCOLS, 'utf8'));
    const library = protocols.protocol_library;
    const onboardProto = library.ONBOARD_V4;
    const metadata = JSON.parse(fs.readFileSync(SOURCES.METADATA, 'utf8'));
    const active = getActiveState();

    // FEAT_STREAMLINED_ONBOARDING: Proxy Guard
    if (active && active.protocol_id === 'ONBOARD_V4') {
        if (!process.env.WARDEN_PROXY_ACTIVE) {
            console.error("\n====================================================");
            console.error("      🛑 WARDEN: PROXY ENFORCEMENT ACTIVE");
            console.error("====================================================");
            console.error("REASON: This induction is part of an active cycle.");
            console.error("IMPACT: Direct execution bypasses the Audit Journal.\n");
            console.error("INSTRUCTION: Use 'node engine/warden.js exec \"<cmd>\"' ");
            console.error("====================================================\n");
            process.exit(1);
        }
    }

    // FEAT_STREAMLINED_ONBOARDING: Stale State Guard
    if (!active && !process.argv.includes('--refresh')) {
        if (fs.existsSync(WARDEN.ACTIVE_STATE)) {
            console.error("\n====================================================");
            console.error("      ❌ WARDEN: ACTIVE SESSION DETECTED");
            console.error("====================================================");
            console.error("REASON: A previous governance session was not closed.");
            console.error("IMPACT: Starting a new induction will corrupt the state stack.\n");
            console.error("INSTRUCTION: Run 'node engine/warden.js close' first.");
            console.error("====================================================\n");
            process.exit(1);
        }
    }

    if (process.argv.includes('--refresh')) {
        showRefresh(library);
        return;
    }

    if (process.argv.includes('--align')) {
        const alignIdx = process.argv.indexOf('--align');
        const token = process.argv[alignIdx + 1];
        if (!fs.existsSync(WARDEN.ONBOARD_STATE)) {
            console.error("❌ Error: No induction in progress.");
            process.exit(1);
        }
        const state = JSON.parse(fs.readFileSync(WARDEN.ONBOARD_STATE, 'utf8'));
        if (token === state.token) {
            state.aligned = true;
            fs.writeFileSync(WARDEN.ONBOARD_STATE, JSON.stringify(state, null, 2));
            console.log("\n✅ ZK FIDELITY ALIGNED.");
            console.log("   Proceed with: node engine/warden.js next\n");
        } else {
            console.error("\n❌ Error: Invalid Handshake Token. Alignment failed.\n");
            process.exit(1);
        }
        return;
    }

    if (!active) {
        showGovernance(library, onboardProto);
        return;
    }

    switch (active.current_state) {
        case '1_HANDSHAKE':
            showGovernance(library, onboardProto);
            break;
        case '2_ALIGNMENT':
            if (!fs.existsSync(WARDEN.ONBOARD_STATE)) {
                const token = Math.random().toString(36).substring(7).toUpperCase();
                fs.writeFileSync(WARDEN.ONBOARD_STATE, JSON.stringify({ token, aligned: false }));
            }
            const onboardState = JSON.parse(fs.readFileSync(WARDEN.ONBOARD_STATE, 'utf8'));
            showAlignment(onboardState);
            break;
        case '3_PLEDGE':
            showPledge();
            break;
        case '4_ORIENTATION':
            showProject(metadata);
            break;
        default:
            console.log(`🛡️ [WARDEN] Onboarding state: ${active.current_state}`);
            break;
    }
}

onboard().catch(err => {
    console.error("Action Failed:", err);
    process.exit(1);
});
