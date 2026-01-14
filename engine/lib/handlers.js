const fs = require('fs');
const path = require('path');
const { WARDEN } = require('../path_resolver');

const SESSION_LOG = WARDEN.SESSION_LOG;

function getFileMTime(filepath) {
    if (!fs.existsSync(filepath)) return 0;
    return fs.statSync(filepath).mtimeMs;
}

function getRecentLogs(since) {
    if (!fs.existsSync(SESSION_LOG)) return [];
    try {
        const lines = fs.readFileSync(SESSION_LOG, 'utf8').split('\n').filter(l => l.trim() !== '');
        return lines.map(l => JSON.parse(l)).filter(entry => entry.timestamp > since);
    } catch (e) {
        console.error(`[Handlers] Error parsing session log: ${e.message}`);
        return [];
    }
}

const HANDLERS = {
    file_freshness: (req, state) => {
        const mtime = getFileMTime(req.target);
        if (mtime < (state.last_transition - 2000)) {
            return { pass: false, error: 'File ' + req.target + ' is stale or missing.' };
        }
        return { pass: true };
    },
    file_exists: (req, state) => {
        if (req.path.includes('*')) {
            const dir = path.dirname(req.path);
            const ext = path.extname(req.path);
            if (!fs.existsSync(dir)) return { pass: false, error: 'Directory ' + dir + ' missing.' };
            const files = fs.readdirSync(dir).filter(f => f.endsWith(ext));
            const fresh = files.find(f => getFileMTime(path.join(dir, f)) > (state.last_transition - 2000));
            if (req.freshness && !fresh) return { pass: false, error: 'No fresh ' + ext + ' files found.' };
            if (files.length === 0) return { pass: false, error: 'No ' + ext + ' files found.' };
        } else {
            if (!fs.existsSync(req.path)) return { pass: false, error: 'File ' + req.path + ' missing.' };
        }
        return { pass: true };
    },
    command_log: (req, state) => {
        const logs = getRecentLogs(state.last_transition - 2000);
        const found = logs.find(entry => entry.command.includes(req.pattern));
        if (!found) {
            return { pass: false, error: `Command matching pattern '${req.pattern}' not found in recent session log.` };
        }
        return { pass: true };
    },
    regex_match_output: (req, state) => {
        const logs = getRecentLogs(state.last_transition - 2000);
        const regex = new RegExp(req.pattern);
        const found = logs.find(entry => regex.test(entry.output));
        if (!found) {
            return { pass: false, error: `Required output pattern '${req.pattern}' not found in recent session logs.` };
        }
        return { pass: true };
    },
    sub_protocol_complete: (req, state) => {
        if (!fs.existsSync(WARDEN.INTERNAL_AUDIT)) return { pass: false, error: 'No audit trail.' };
        const audit = JSON.parse(fs.readFileSync(WARDEN.INTERNAL_AUDIT, 'utf8'));
        
        // Check for INITIALIZE event of sub-protocol AFTER parent start time
        const valid = audit.history.find(h => 
            h.protocol_id === req.protocol_id && 
            h.timestamp > state.start_time &&
            h.action === 'INITIALIZE'
        );
        
        if (!valid) return { pass: false, error: `Mandatory sub-protocol '${req.protocol_id}' not executed.` };
        return { pass: true };
    }
};

module.exports = { HANDLERS };