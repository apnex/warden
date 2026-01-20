## 🛡️ The Integrity Model: Three-Way Audit

Warden ensures high-fidelity engineering through a "Three-Way Audit" chain that provides non-repudiation for every change.

### 1. Intent (The Registry)
Every action must map to a **Canonical Intent** defined in the project or system registry. If an action does not match a known intent, it is flagged as a potential "Protocol Breach."

### 2. Action (The Session Journal)
All CLI interactions are proxied through `warden.js exec`. This creates a bit-perfect `session.log` that captures the exact command, the environment, and the resulting output.

### 3. Verification (The Internal Audit)
Upon completing a turn, the engine verifies that the requirements of the protocol state (Gates) have been satisfied. The successful transition is recorded in the `internal_audit.json`, cryptographically linking the intended state to the verified action.

### Non-Repudiation
By linking these three layers, Warden proves that a specific version of code was produced by a specific agent, authorized by a specific Director, following a specific verified protocol.
