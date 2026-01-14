const fs = require('fs');
const path = require('path');

function validate(schema, data, path = '') {
    if (!schema) return [];
    const errors = [];

    // Type Check
    if (schema.type) {
        const type = Array.isArray(data) ? 'array' : typeof data;
        if (schema.type === 'number' && type === 'number') {
            // ok
        } else if (schema.type !== type) {
            return [`[${path}] Expected type ${schema.type}, got ${type}`];
        }
    }

    // Enum
    if (schema.enum && !schema.enum.includes(data)) {
        errors.push(`[${path}] Value ${data} not in enum [${schema.enum.join(', ')}]`);
    }

    // Object Validation
    if (schema.type === 'object') {
        // Required
        if (schema.required) {
            schema.required.forEach(req => {
                if (data[req] === undefined) {
                    errors.push(`[${path}] Missing required property: ${req}`);
                }
            });
        }

        // Properties
        if (schema.properties) {
            Object.keys(schema.properties).forEach(key => {
                if (data[key] !== undefined) {
                    errors.push(...validate(schema.properties[key], data[key], `${path}.${key}`));
                }
            });
        }

        // Pattern Properties
        if (schema.patternProperties) {
            Object.keys(data).forEach(key => {
                if (schema.properties && schema.properties[key]) return;
                let matched = false;
                Object.keys(schema.patternProperties).forEach(pattern => {
                    if (new RegExp(pattern).test(key)) {
                        matched = true;
                        errors.push(...validate(schema.patternProperties[pattern], data[key], `${path}.${key}`));
                    }
                });
            });
        }
    }

    // Array Validation
    if (schema.type === 'array' && schema.items) {
        data.forEach((item, index) => {
            errors.push(...validate(schema.items, item, `${path}[${index}]`));
        });
    }

    // OneOf
    if (schema.oneOf) {
        const passed = schema.oneOf.some(subSchema => {
            const subErrors = validate(subSchema, data, path);
            return subErrors.length === 0;
        });
        if (!passed) {
            errors.push(`[${path}] Failed all oneOf schemas.`);
        }
    }

    return errors;
}

function run() {
    const args = process.argv.slice(2);
    const isFix = args.includes('--fix');
    const cleanArgs = args.filter(a => a !== '--fix');

    const schemaPath = cleanArgs[0];
    const dataPath = cleanArgs[1];

    if (!schemaPath || !dataPath) {
        console.log("Usage: node tools/validate_schema.js [--fix] <schema.json> <data.json>");
        process.exit(1);
    }

    try {
        let content = fs.readFileSync(dataPath, 'utf8');
        
        if (isFix) {
            // Fix unescaped backslashes in regex patterns
            content = content.replace(/"pattern":\s*"(.*?[^\\])\\(?![\\\"])(.*?)"/g, '"pattern": "$1\\\\$2"');
            fs.writeFileSync(dataPath, content);
            console.log("[Fix] Attempted JSON cleanup.");
        }

        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        const data = JSON.parse(content);
        const errors = validate(schema, data, 'root');
        
        if (errors.length > 0) {
            console.error("Schema Validation Failed:");
            errors.forEach(e => console.error(" - " + e));
            process.exit(1);
        } else {
            console.log("Schema Validation Passed.");
        }
    } catch (e) {
        console.error("Execution Error:", e.message);
        process.exit(1);
    }
}

if (require.main === module) {
    run();
}