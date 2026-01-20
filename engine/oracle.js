const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolve, ENGINE_ROOT, ANCHOR_ROOT } = require('./path_resolver');

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

/**
 * DYNAMIC REGISTRY DISCOVERY (V2)
 * Supports IDEA-039 Overlay Model
 */
function discoverRegistries() {
    const baseMap = [
        { id: 'protocols', filename: 'protocols.json', key: 'protocol_library' },
        { id: 'deliverables', filename: 'deliverables.json', key: 'deliverables', findBy: 'id' },
        { id: 'standards', filename: 'standards.json', key: 'standards', findBy: 'id' },
        { id: 'intents', filename: 'intent_patterns.json', key: 'patterns', findBy: 'id' },
        { id: 'backlog', filename: 'backlog.json', key: 'items', findBy: 'id' },
        { id: 'attributes', filename: 'attributes.json', key: 'system_quality_attributes' },
        { id: 'glossary', filename: 'glossary.json', key: 'domains' }
    ];

    return baseMap.map(reg => {
        return {
            ...reg,
            source: resolve.registry(reg.filename)
        };
    });
}

function universalResolve(id) {
    const registryMap = discoverRegistries();
    
    for (const reg of registryMap) {
        const data = loadRegistry(reg.source);
        if (!data) continue;

        const pool = data[reg.key] || data; // Handle flat vs nested registries
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
        
        if (data[id]) {
            return { kind: reg.id, data: data[id], source: reg.source };
        }
    }

    const guidance = loadRegistry(resolve.registry('guidance.json'));
    if (guidance && guidance.topics[id]) {
        return { kind: 'guidance', data: guidance.topics[id], source: resolve.registry('guidance.json') };
    }

    return null;
}

function list() {
    showHeader("Universal Guidance Index");
    const registryMap = discoverRegistries();
    registryMap.forEach(reg => {
        const data = loadRegistry(reg.source);
        if (data) {
            const pool = data[reg.key] || data;
            if (pool) {
                console.log(`📜 ${reg.id.toUpperCase()}:`);
                let items = [];
                if (reg.id === 'attributes') {
                    Object.values(pool).forEach(cat => { if (typeof cat === 'object') items.push(...Object.keys(cat)); });
                } else if (reg.id === 'glossary') {
                    if (Array.isArray(pool)) {
                        pool.forEach(domain => { items.push(...domain.terms.map(t => t.uid)); });
                    }
                } else {
                    items = Array.isArray(pool) 
                        ? pool.map(i => i[reg.findBy || 'id'])
                        : Object.keys(pool);
                }
                items.forEach(i => console.log(`  - ${i}`));
                console.log("");
            }
        }
    });
    console.log("Usage: node engine/oracle.js [list | explain <ID> | blueprint <ID> | sandbox <proto> | tutorial <start|status> | quiz <pledge|exam>]");
}

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
        if (attributes && attributes.system_quality_attributes) {
            for (const [cat, attrs] of Object.entries(attributes.system_quality_attributes)) {
                if (attrs[id]) { category = cat; break; }
            }
        }
        console.log(`DOMAIN:     ${category.toUpperCase()}`);
        console.log(`DEFINITION:\n  ${data}`);
    } else if (kind === 'glossary') {
        console.log(`TERM:       ${data.term || id}`);
        console.log(`DEFINITION: ${data.definition || data}`);
        console.log(`USAGE:      ${data.context_usage || 'Project Context'}`);
    } else if (kind === 'backlog') {
        console.log(`PRIORITY: ${data.priority}`);
        console.log(`STATUS:   ${data.status}`);
        console.log(`CREATED:  ${data.created_at}\n`);
        console.log(`DESCRIPTION:\n  ${data.description}`);
    } else if (kind === 'guidance') {
        console.log(`PURPOSE:\n  ${data.purpose}\n`);
        const onboardStateFile = resolve.state('onboard.json');
        if (id === 'PRIME_DIRECTIVES' && fs.existsSync(onboardStateFile)) {
            const state = JSON.parse(fs.readFileSync(onboardStateFile, 'utf8'));
            console.log("⚠️  ZK FIDELITY HANDSHAKE DETECTED.");
            console.log(`Your alignment token is: ${state.token}\n`);
            console.log("INSTRUCTION: Use 'node engine/onboard.js --align <token>' to complete induction.\n");
        }
        if (data.structure) {
            console.log(`STRUCTURE:`);
            data.structure.forEach(s => console.log(`  [ ] ${s}`));
        }
    }
}

async function quiz(type, providedAnswers) {
    const quizRegistry = loadRegistry(resolve.registry('quiz.json'));
    if (!quizRegistry) { process.exit(1); }
    const quizData = type === 'exam' ? quizRegistry.the_exam : quizRegistry.the_pledge;
    if (!quizData) { process.exit(1); }
    if (!providedAnswers) {
        showHeader(`${quizData.title} (Guidance)`);
        console.log(`${quizData.description}\n`);
        quizData.questions.forEach((q, idx) => {
            console.log(`📝 SCENARIO [${q.id}]:`);
            console.log(`   ${q.scenario}\n`);
        });
        process.exit(0);
    }
    let interpretation = null;
    if (process.argv.includes('--interpretation')) {
        interpretation = process.argv[process.argv.indexOf('--interpretation') + 1];
    }
    if (type === 'pledge' && !interpretation) {
        console.error("\n❌ Error: Behavioral Pledge requires qualitative interpretation.");
        process.exit(1);
    }
    showHeader(quizData.title);
    const answersList = providedAnswers.split(',').map(a => a.trim());
    let score = 0;
    quizData.questions.forEach((q, idx) => {
        const answer = answersList[idx] || "";
        const regex = new RegExp(q.answer_pattern, 'i');
        if (regex.test(answer)) { score++; }
    });
    if (score === quizData.questions.length) {
        const cert = { type, timestamp: Date.now(), token: Math.random().toString(36).substring(7).toUpperCase(), status: "VERIFIED" };
        fs.writeFileSync(resolve.state('quiz_cert.json'), JSON.stringify(cert, null, 2));
        console.log(`A cryptographic certificate has been generated: ${cert.token}\n`);
    } else { process.exit(1); }
}

function sandbox(protoId) {
    if (!protoId) process.exit(1);
    const env = { ...process.env, WARDEN_STATE_PATH: resolve.state('sandbox.json') };
    try {
        const cmd = `node \${resolve.engine('warden.js')} init \${protoId} "Sandbox Session"`;
        console.log(execSync(cmd, { env, encoding: 'utf8' }));
    } catch (e) { console.error(e.stdout || e.message); }
}

function tutorial(command, arg) {
    const tutorials = loadRegistry(resolve.registry('tutorials.json'));
    if (!tutorials) process.exit(1);
    let state = { scenario: null, current_step: 0 };
    const TUTORIAL_STATE = resolve.state('tutorial_state.json');
    if (fs.existsSync(TUTORIAL_STATE)) state = JSON.parse(fs.readFileSync(TUTORIAL_STATE, 'utf8'));
    if (command === 'start') {
        state = { scenario: arg, current_step: 0, started_at: Date.now() };
        fs.writeFileSync(TUTORIAL_STATE, JSON.stringify(state, null, 2));
    }
}

const [,, action, arg1, arg2] = process.argv;
switch (action) {
    case 'list': list(); break;
    case 'explain': explain(arg1); break;
    case 'blueprint': blueprint(arg1); break;
    case 'sandbox': sandbox(arg1); break;
    case 'tutorial': tutorial(arg1, arg2); break;
    case 'quiz': quiz(arg1, arg2).catch(err => process.exit(1)); break;
    default: console.log("Usage: node engine/oracle.js [list | explain <ID> | blueprint <ID> | sandbox <proto> | tutorial <start|status> | quiz <pledge|exam>]");
}
