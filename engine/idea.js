const fs = require('fs');
const path = require('path');
const { SOURCES, resolve } = require('./path_resolver');

const IDEAS_FILE = resolve.registry('ideas.json');

function loadIdeas() {
    if (!fs.existsSync(IDEAS_FILE)) return { ideas: [] };
    return JSON.parse(fs.readFileSync(IDEAS_FILE, 'utf8'));
}

function saveIdeas(data) {
    fs.writeFileSync(IDEAS_FILE, JSON.stringify(data, null, 2));
}

function add(title, description) {
    const data = loadIdeas();
    const id = `IDEA-${String(data.ideas.length + 1).padStart(3, '0')}`;
    const newIdea = {
        id,
        status: "INCUBATING",
        title,
        description,
        dialogue: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    data.ideas.push(newIdea);
    saveIdeas(data);
    console.log(`[Success] Idea captured: ${id}`);
}

function list() {
    const data = loadIdeas();
    if (data.ideas.length === 0) {
        console.log("No ideas found.");
        return;
    }
    console.log("\n💡 IDEA REGISTRY");
    console.log("----------------------------------------------------\n");
    data.ideas.forEach(i => {
        console.log(`[${i.id}] ${i.status} | ${i.title}`);
    });
    console.log("----------------------------------------------------\n");
}

const [,, command, ...args] = process.argv;

switch (command) {
    case 'add':
        if (args.length < 2) {
            console.error("Usage: node engine/idea.js add \"Title\" \"Description\"");
            process.exit(1);
        }
        add(args[0], args[1]);
        break;
    case 'list':
        list();
        break;
    default:
        console.log("Usage: node engine/idea.js [add|list]");
}
