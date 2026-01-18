const fs = require('fs');
const path = require('path');
const { resolve } = require('./path_resolver');

const CONCEPTS_FILE = resolve.active('registry', 'concepts.json');
const CONCEPTS_DIR = resolve.active('registry', 'concepts');

function loadIndex() {
    if (!fs.existsSync(CONCEPTS_FILE)) return { concepts: [] };
    return JSON.parse(fs.readFileSync(CONCEPTS_FILE, 'utf8'));
}

function saveIndex(data) {
    fs.writeFileSync(CONCEPTS_FILE, JSON.stringify(data, null, 2));
}

function create(title, ideaId, architectDetails) {
    const index = loadIndex();
    const id = `CON-${String(index.concepts.length + 1).padStart(3, '0')}`;
    
    const conceptObj = {
        id,
        source_idea: ideaId,
        title,
        status: "RATIFIED",
        spec: architectDetails,
        created_at: new Date().toISOString()
    };

    if (!fs.existsSync(CONCEPTS_DIR)) fs.mkdirSync(CONCEPTS_DIR, { recursive: true });
    
    const filePath = path.join(CONCEPTS_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(conceptObj, null, 2));
    
    index.concepts.push({ id, title, source_idea: ideaId });
    saveIndex(index);
    
    console.log(`\n[Success] High-Fidelity Concept Codified: ${id}`);
    console.log(`  - Path: registry/concepts/${id}.json`);
    console.log(`  - Link: ${ideaId}`);
}

function list() {
    const index = loadIndex();
    console.log("\n📘 CONCEPT REGISTRY");
    console.log("----------------------------------------------------\n");
    index.concepts.forEach(c => {
        console.log(`[${c.id}] ${c.title} (Source: ${c.source_idea})`);
    });
    console.log("----------------------------------------------------\n");
}

const [,, command, ...args] = process.argv;

switch (command) {
    case 'create':
        if (args.length < 3) {
            console.error("Usage: node engine/concept.js create \"Title\" \"IDEA-###\" \"{verbose_spec}\"");
            process.exit(1);
        }
        create(args[0], args[1], args[2]);
        break;
    case 'list':
        list();
        break;
    default:
        console.log("Usage: node engine/concept.js [create|list]");
}
