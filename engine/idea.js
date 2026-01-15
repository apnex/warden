const fs = require('fs');
const path = require('path');
const { resolve } = require('./path_resolver');

const IDEAS_DIR = resolve.registry('ideas');

// Ensure directory exists
if (!fs.existsSync(IDEAS_DIR)) {
    fs.mkdirSync(IDEAS_DIR, { recursive: true });
}

function getNextId() {
    const files = fs.readdirSync(IDEAS_DIR).filter(f => f.match(/^IDEA-\d+\.json$/));
    if (files.length === 0) return 'IDEA-001';
    
    const maxId = files.reduce((max, f) => {
        const num = parseInt(f.match(/^IDEA-(\d+)\.json$/)[1]);
        return num > max ? num : max;
    }, 0);
    
    return `IDEA-${String(maxId + 1).padStart(3, '0')}`;
}

function loadIdea(id) {
    // Handle cases where ID might be passed with or without .json
    const cleanId = id.replace('.json', '');
    const filePath = path.join(IDEAS_DIR, `${cleanId}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveIdea(idea) {
    const filePath = path.join(IDEAS_DIR, `${idea.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(idea, null, 2));
}

function create(title, description) {
    const id = getNextId();
    const idea = {
        id,
        title,
        description,
        status: "INCUBATING",
        author: "Engineer",
        created: new Date().toISOString().split('T')[0],
        dialogue: [],
        components: []
    };
    saveIdea(idea);
    console.log(`[Success] Idea captured: ${id}`);
}

function refine(id, note) {
    const idea = loadIdea(id);
    if (!idea) {
        console.error(`[Error] Idea ${id} not found.`);
        process.exit(1);
    }
    
    idea.dialogue.push({
        timestamp: new Date().toISOString(),
        note: note
    });
    saveIdea(idea);
    console.log(`[Success] Refinement added to ${id}`);
}

function promote(id) {
    const idea = loadIdea(id);
    if (!idea) {
        console.error(`[Error] Idea ${id} not found.`);
        process.exit(1);
    }
    idea.status = "GERMINATING";
    saveIdea(idea);
    console.log(`[Success] Idea ${id} promoted to GERMINATING`);
}

function archive(id) {
    const idea = loadIdea(id);
    if (!idea) {
        console.error(`[Error] Idea ${id} not found.`);
        process.exit(1);
    }
    idea.status = "ARCHIVED";
    saveIdea(idea);
    console.log(`[Success] Idea ${id} archived`);
}

function list() {
    const files = fs.readdirSync(IDEAS_DIR).filter(f => f.endsWith('.json'));
    console.log("\n💡 IDEA REGISTRY");
    console.log("----------------------------------------------------\n");
    files.forEach(f => {
        try {
            const idea = JSON.parse(fs.readFileSync(path.join(IDEAS_DIR, f), 'utf8'));
            console.log(`[${idea.id || f.replace('.json','')}] ${idea.status} | ${idea.title}`);
        } catch (e) {}
    });
    console.log("----------------------------------------------------\n");
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log("Usage: node engine/idea.js [--create|--refine|--promote|--archive|--list]");
    process.exit(0);
}

const command = args[0];

switch (command) {
    case '--create':
    case 'add': // Legacy support
        if (args.length < 3) {
            console.error("Usage: node engine/idea.js --create \"Title\" \"Description\"");
            process.exit(1);
        }
        create(args[1], args[2]);
        break;
    case '--refine':
        if (args.length < 3) {
            console.error("Usage: node engine/idea.js --refine <ID> \"Note\"");
            process.exit(1);
        }
        refine(args[1], args[2]);
        break;
    case '--promote':
        if (args.length < 2) {
            console.error("Usage: node engine/idea.js --promote <ID>");
            process.exit(1);
        }
        promote(args[1]);
        break;
    case '--archive':
        if (args.length < 2) {
            console.error("Usage: node engine/idea.js --archive <ID>");
            process.exit(1);
        }
        archive(args[1]);
        break;
    case '--list':
    case 'list': // Legacy support
        list();
        break;
    default:
        console.log("Unknown command. Usage: node engine/idea.js [--create|--refine|--promote|--archive|--list]");
}