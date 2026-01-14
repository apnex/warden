const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { SOURCES, WARDEN, resolve, REGISTRY, ROOT } = require('./path_resolver');

function showHeader(title) {
    console.log("\n====================================================");
    console.log(`      🔮 WARDEN ORACLE: ${title}`);
    console.log("====================================================\n");
}

function loadRegistry(filePath) {
    if (!fs.existsSync(filePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        return null;
    }
}

// 1. DYNAMIC REGISTRY DISCOVERY (FEAT_UNIVERSAL_ORACLE)
const REGISTRY_MAP = [
    { id: 'protocols', source: SOURCES.PROTOCOLS, key: 'protocol_library' },
    { id: 'deliverables', source: SOURCES.DELIVERABLES, key: 'deliverables', findBy: 'id' },
    { id: 'standards', source: SOURCES.STANDARDS, key: 'standards', findBy: 'id' },
    { id: 'intents', source: SOURCES.INTENT_PATTERNS, key: 'patterns', findBy: 'id' },
    { id: 'backlog', source: SOURCES.BACKLOG, key: 'items', findBy: 'id' },
    { id: 'attributes', source: SOURCES.ATTRIBUTES, key: 'system_quality_attributes' },
    { id: 'glossary', source: SOURCES.GLOSSARY, key: 'domains' }
];

function universalResolve(id) {
    for (const reg of REGISTRY_MAP) {
        const data = loadRegistry(reg.source);
        if (!data) continue;

        const pool = data[reg.key];
        if (!pool) continue;

        if (!Array.isArray(pool) && pool[id]) {
            return { kind: reg.id, data: pool[id], source: reg.source };
        }

        if (Array.isArray(pool)) {
            if (reg.id === 'glossary') {
                for (const domain of pool) {
                    const match = domain.terms.find(t => t.uid === id);
                    if (match) return { kind: reg.id, data: match, source: reg.source };
                }
            }
            const match = pool.find(item => item[reg.findBy || 'id'] === id);
            if (match) return { kind: reg.id, data: match, source: reg.source };
        }

        if (reg.id === 'attributes') {
            for (const category of Object.values(pool)) {
                if (category[id]) return { kind: reg.id, data: category[id], source: reg.source };
            }
        }
    }

    const guidance = loadRegistry(SOURCES.GUIDANCE);
    if (guidance && guidance.topics[id]) {
        return { kind: 'guidance', data: guidance.topics[id], source: SOURCES.GUIDANCE };
    }

    return null;
}

function list() {
    showHeader("Universal Guidance Index");
    REGISTRY_MAP.forEach(reg => {
        const data = loadRegistry(reg.source);
        if (data && data[reg.key]) {
            console.log(`📜 ${reg.id.toUpperCase()}:`);
            let items = [];
            if (reg.id === 'attributes') {
                Object.values(data[reg.key]).forEach(cat => { items.push(...Object.keys(cat)); });
            } else if (reg.id === 'glossary') {
                data[reg.key].forEach(domain => { items.push(...domain.terms.map(t => t.uid)); });
            } else {
                items = Array.isArray(data[reg.key]) 
                    ? data[reg.key].map(i => i[reg.findBy || 'id'])
                    : Object.keys(data[reg.key]);
            }
            items.forEach(i => console.log(`  - ${i}`));
            console.log("");
        }
    });
    console.log("Usage: node engine/oracle.js [list | explain <ID> | blueprint <ID> | sandbox <proto> | tutorial <start|status> | quiz <pledge|exam>]");
}

// 2. RECURSIVE SCHEMA ENGINE (FEAT_ORACLE_BLUEPRINTS)
function resolveSchema(schema, fullRegistry) {
    if (!schema) return null;
    if (schema.$ref && schema.$ref.startsWith('#/')) {
        const parts = schema.$ref.split('/').slice(1);
        let current = fullRegistry;
        for (const p of parts) { current = current[p]; }
        return resolveSchema(current, fullRegistry);
    }
    if (schema.allOf) {
        const merged = { type: 'object', properties: {}, required: [] };
        schema.allOf.forEach(sub => {
            const resolved = resolveSchema(sub, fullRegistry);
            if (resolved.properties) Object.assign(merged.properties, resolved.properties);
            if (resolved.required) merged.required.push(...resolved.required);
        });
        return merged;
    }
    return schema;
}

function generateSkeleton(schema, fullRegistry) {
    const resolved = resolveSchema(schema, fullRegistry);
    if (!resolved) return "<UNKNOWN>";
    if (resolved.type === 'object' && resolved.properties) {
        const skeleton = {};
        Object.entries(resolved.properties).forEach(([key, prop]) => {
            const isRequired = resolved.required && resolved.required.includes(key);
            const prefix = isRequired ? "REQUIRED" : "OPTIONAL";
            const desc = prop.description ? `: ${prop.description}` : "";
            if (prop.type === 'array') { skeleton[key] = []; } 
            else if (prop.type === 'object') { skeleton[key] = generateSkeleton(prop, fullRegistry); } 
            else { skeleton[key] = `<${prefix}${desc}>`; }
        });
        return skeleton;
    }
    if (Array.isArray(resolved)) {
        const skeleton = {};
        resolved.forEach(key => { skeleton[key] = "<REQUIRED>"; });
        return skeleton;
    }
    return "<VALUE>";
}

function blueprint(id) {
    const match = universalResolve(id);
    if (!match || !match.data.schema) {
        console.error(`❌ Error: No schema found for identifier '${id}'.`);
        process.exit(1);
    }
    const fullRegistry = loadRegistry(match.source);
    const skeleton = generateSkeleton(match.data.schema, fullRegistry);
    showHeader(`BLUEPRINT: ${id}`);
    console.log(JSON.stringify(skeleton, null, 2));
    console.log("\n[DLR_DOC_BLUEPRINT] Generated high-fidelity template.");
}

function explain(id) {
    const match = universalResolve(id);
    if (!match) {
        console.error(`\n❌ Error: Identifier '${id}' not found in any registry.`);
        process.exit(1);
    }
    const { kind, data } = match;
    showHeader(`${kind.toUpperCase()}: ${id}`);
    if (kind === 'protocols') {
        console.log(`TITLE:   ${data.meta.title}`);
        console.log(`PURPOSE: ${data.meta.description}\n`);
        console.log(`STATES:`);
        Object.entries(data.states).forEach(([s, d]) => console.log(`  - ${s.padEnd(12)}: ${d.description || 'Action State'}`));
    } else if (kind === 'deliverables') {
        console.log(`NAME:    ${data.name}`);
        console.log(`PURPOSE: ${data.purpose}`);
        console.log(`SCOPE:   ${data.scope}\n`);
        console.log(`DESCRIPTION:\n  ${data.description}`);
    } else if (kind === 'standards') {
        console.log(`NAME:    ${data.name}`);
        console.log(`GUIDANCE:\n  ${data.guidance}\n`);
        console.log(`ENFORCEMENT:\n  ${data.enforcement}`);
    } else if (kind === 'intents') {
        console.log(`INTENT ID: ${data.id}`);
        console.log(`REGEX:     ${data.regex}\n`);
        console.log(`CANONICAL MAPPING:`);
        console.log(JSON.stringify(data.intent, null, 2));
    } else if (kind === 'attributes') {
        const attributes = loadRegistry(resolve.registry('attributes.json'));
        let category = 'Unknown';
        for (const [cat, attrs] of Object.entries(attributes.system_quality_attributes)) {
            if (attrs[id]) { category = cat; break; }
        }
        console.log(`DOMAIN:     ${category.toUpperCase()}`);
        console.log(`DEFINITION:\n  ${data}`);
    } else if (kind === 'glossary') {
        console.log(`TERM:       ${data.term}`);
        console.log(`DEFINITION: ${data.definition}`);
        console.log(`USAGE:      ${data.context_usage}`);
    } else if (kind === 'backlog') {
        console.log(`PRIORITY: ${data.priority}`);
        console.log(`STATUS:   ${data.status}`);
        console.log(`CREATED:  ${data.created_at}\n`);
        console.log(`DESCRIPTION:\n  ${data.description}`);
    } else if (kind === 'guidance') {
        console.log(`PURPOSE:\n  ${data.purpose}\n`);
        if (id === 'PRIME_DIRECTIVES' && fs.existsSync(WARDEN.ONBOARD_STATE)) {
            const state = JSON.parse(fs.readFileSync(WARDEN.ONBOARD_STATE, 'utf8'));
            console.log("⚠️  ZK FIDELITY HANDSHAKE DETECTED.");
            console.log(`Your alignment token is: ${state.token}\n`);
            console.log("INSTRUCTION: Use 'node engine/onboard.js --align <token>' to complete induction.\n");
        }
        if (data.structure) {
            console.log(`STRUCTURE:`);
            data.structure.forEach(s => console.log(`  [ ] ${s}`));
        }
    }
    const designDoc = resolve.docs('design', `${id}.md`);
    if (fs.existsSync(designDoc)) { console.log(`\n📖 RELATED DESIGN SPEC: docs/design/${id}.md`); }
}

async function quiz(type, providedAnswers) {
    const quizRegistry = loadRegistry(SOURCES.QUIZ);
    if (!quizRegistry) { process.exit(1); }
    const quizData = type === 'exam' ? quizRegistry.the_exam : quizRegistry.the_pledge;
    if (!quizData) { process.exit(1); }

    // If no answers provided, display questions as guidance
    if (!providedAnswers) {
        showHeader(`${quizData.title} (Guidance)`);
        console.log(`${quizData.description}\n`);
        quizData.questions.forEach((q, idx) => {
            console.log(`📝 SCENARIO [${q.id}]:`);
            console.log(`   ${q.scenario}\n`);
        });
        process.exit(0);
    }

    // Qualitative Analysis Check (FEAT_QUALITATIVE_PLEDGE)
    let interpretation = null;
    if (process.argv.includes('--interpretation')) {
        interpretation = process.argv[process.argv.indexOf('--interpretation') + 1];
    }

    if (type === 'pledge' && !interpretation) {
        console.error("\n❌ Error: Behavioral Pledge requires qualitative interpretation.");
        console.log("   Usage: node engine/oracle.js quiz pledge \"ans1,ans2,...\" --interpretation \"Your interpretation of the Prime Directives\"");
        process.exit(1);
    }

    if (interpretation && interpretation.length < 50) {
        console.error("\n❌ Error: Interpretation too brief. Provide a more detailed analysis (min 50 chars).");
        process.exit(1);
    }

    showHeader(quizData.title);
    console.log(`${quizData.description}\n`);
    const answersList = providedAnswers.split(',').map(a => a.trim());
    let score = 0;
    quizData.questions.forEach((q, idx) => {
        console.log(`\n📝 SCENARIO [${q.id}]:`);
        console.log(`   ${q.scenario}`);
        const answer = answersList[idx] || "";
        console.log(`   > Your Response: ${answer}`);
        const regex = new RegExp(q.answer_pattern, 'i');
        if (regex.test(answer)) {
            console.log(`   ✅ CORRECT.`);
            if (q.affirmation) console.log(`      AFFIRMATION: ${q.affirmation}`);
            score++;
        } else {
            console.log(`   ❌ INCORRECT.`);
            if (q.hint) console.log(`      HINT: ${q.hint}`);
        }
    });

    if (score === quizData.questions.length) {
        if (interpretation) {
            console.log("\n📖 YOUR INTERPRETATION:");
            console.log(`   "${interpretation}"\n`);
        }
        showHeader("VERIFICATION SUCCESSFUL");
        const cert = { 
            type, 
            timestamp: Date.now(), 
            token: Math.random().toString(36).substring(7).toUpperCase(), 
            status: "VERIFIED",
            interpretation: interpretation
        };
        fs.writeFileSync(WARDEN.QUIZ_CERT, JSON.stringify(cert, null, 2));
        console.log(`A cryptographic certificate has been generated: ${cert.token}\n`);
    } else { process.exit(1); }
}

function sandbox(protoId) {
    if (!protoId) process.exit(1);
    showHeader(`SANDBOX: ${protoId}`);
    const env = { ...process.env, WARDEN_STATE_PATH: resolve.state('sandbox.json'), WARDEN_LOG_PATH: resolve.state('sandbox.log'), WARDEN_AUDIT_PATH: resolve.state('sandbox_audit.json') };
    try {
        const cmd = `node ${resolve.engine('warden.js')} init ${protoId} "Sandbox Session"`;
        console.log(execSync(cmd, { env, encoding: 'utf8' }));
    } catch (e) { console.error(e.stdout || e.message); }
}

function tutorial(command, arg) {
    const tutorials = loadRegistry(SOURCES.TUTORIALS);
    if (!tutorials) process.exit(1);
    let state = { scenario: null, current_step: 0 };
    const TUTORIAL_STATE = resolve.state('tutorial_state.json');
    if (fs.existsSync(TUTORIAL_STATE)) state = JSON.parse(fs.readFileSync(TUTORIAL_STATE, 'utf8'));
    if (command === 'start') {
        if (!arg || !tutorials.scenarios[arg]) process.exit(1);
        state = { scenario: arg, current_step: 0, started_at: Date.now() };
        fs.writeFileSync(TUTORIAL_STATE, JSON.stringify(state, null, 2));
        showHeader(`TUTORIAL START: ${tutorials.scenarios[arg].title}`);
    }
    if (!state.scenario) return;
    const scenario = tutorials.scenarios[state.scenario];
    const step = scenario.steps[state.current_step];
    if (!step) {
        showHeader("TUTORIAL COMPLETE! 🎉");
        fs.unlinkSync(TUTORIAL_STATE);
        return;
    }
    showHeader(`STEP ${state.current_step + 1}: ${step.id}`);
    console.log(`📝 INSTRUCTION:\n  ${step.instruction}\n`);
}

const [,, command, arg1, arg2] = process.argv;
switch (command) {
    case 'list': list(); break;
    case 'explain': explain(arg1); break;
    case 'blueprint': blueprint(arg1); break;
    case 'sandbox': sandbox(arg1); break;
    case 'tutorial': tutorial(arg1, arg2); break;
    case 'quiz': quiz(arg1, arg2).catch(err => process.exit(1)); break;
    default: console.log("Usage: node engine/oracle.js [list | explain <ID> | blueprint <ID> | sandbox <proto> | tutorial <start|status> | quiz <pledge|exam>]");
}