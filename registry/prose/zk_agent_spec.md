## 🤖 Warden-Aware Agent Specification

AI agents (Zero-Knowledge entities) must adhere to the following checklist when operating in a Warden-governed project:

### 1. Context Discovery
- Locate the `warden` proxy script in the project root.
- Query the current state using `./warden status`.

### 2. Knowledge Retrieval
- Consult the Oracle before execution: `./warden exec "node engine/oracle.js explain <TOPIC>"`.
- Use `./warden exec "node engine/oracle.js list"` to see available standards and attributes.

### 3. Proxy-Only Execution
- **Never** run critical commands directly. Always wrap them in `./warden exec "..."`.
- Provide qualitative reasoning using the `--justify` flag when performing non-standard actions.

### 4. Turn Boundary Respect
- Observe all **Cognitive Halts**.
- Do not chain multiple protocol transitions in a single turn without Director ratification.
- Prioritize **Integrity over Velocity**.
