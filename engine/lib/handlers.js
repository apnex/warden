const fs = require('fs');
const path = require('path');
const { resolve, TARGET_ROOT } = require('../path_resolver');

function getFileMTime(filepath) {
    if (!fs.existsSync(filepath)) return 0;
    return fs.statSync(filepath).mtimeMs;
}

function getRecentLogs(since) {
    const sessionLog = resolve.state('session.log');
    if (!fs.existsSync(sessionLog)) return [];
    try {
        const lines = fs.readFileSync(sessionLog, 'utf8').split('\n').filter(l => l.trim() !== '');
        return lines.map(l => JSON.parse(l)).filter(entry => entry.timestamp > since);
    } catch (e) {
        console.error("[Handlers] Error parsing session log: " + e.message);
        return [];
    }
}

const HANDLERS = {
    file_freshness: (req, state) => {
        const fullPath = path.resolve(TARGET_ROOT, req.target);
        const mtime = getFileMTime(fullPath);
        if (mtime < (state.last_transition - 2000)) {
            return { pass: false, error: 'File ' + req.target + ' is stale or missing.' };
        }
        return { pass: true };
    },
    file_exists: (req, state) => {
        // Handle path resolution via resolve anchor
        const fullPath = path.resolve(TARGET_ROOT, req.path);
        
        if (req.path.includes('*')) {
            const dir = path.dirname(fullPath);
            const ext = path.extname(req.path);
            if (!fs.existsSync(dir)) return { pass: false, error: 'Directory ' + dir + ' missing.' };
            const files = fs.readdirSync(dir).filter(f => f.endsWith(ext));
            const fresh = files.find(f => getFileMTime(path.join(dir, f)) > (state.last_transition - 2000));
            if (req.freshness && !fresh) return { pass: false, error: 'No fresh ' + ext + ' files found in ' + dir };
            if (files.length === 0) return { pass: false, error: 'No ' + ext + ' files found.' };
        } else {
            if (!fs.existsSync(fullPath)) return { pass: false, error: 'File ' + req.path + ' missing at ' + fullPath };
        }
        return { pass: true };
    },
    command_log: (req, state) => {
        const logs = getRecentLogs(state.last_transition - 2000);
        const found = logs.find(entry => entry.command.includes(req.pattern));
        if (!found) {
            return { pass: false, error: "Command matching pattern '" + req.pattern + "' not found in recent session log." };
        }
        return { pass: true };
    },
    regex_match_output: (req, state) => {
        const logs = getRecentLogs(state.last_transition - 2000);
        const regex = new RegExp(req.pattern);
        const found = logs.find(entry => regex.test(entry.output));
        if (!found) {
            return { pass: false, error: "Required output pattern '" + req.pattern + "' not found in recent session logs." };
        }
        return { pass: true };
    },
    sub_protocol_complete: (req, state) => {
        const internalAudit = resolve.state('internal_audit.json');
        if (!fs.existsSync(internalAudit)) return { pass: false, error: 'No audit trail.' };
        const audit = JSON.parse(fs.readFileSync(internalAudit, 'utf8'));
        
        const valid = audit.history.find(h => 
            h.protocol_id === req.protocol_id && 
            h.timestamp > state.start_time &&
            h.action === 'INITIALIZE'
        );
        
        if (!valid) return { pass: false, error: "Mandatory sub-protocol '" + req.protocol_id + "' not executed." };
        return { pass: true };
    }
};

module.exports = { HANDLERS };
