# 🛡️ Warden Governance Engine - v1.6.0

**Version:** 0.0.3  
**Generated:** 1/20/2026, 10:35:18 PM  

## 📋 Overview
The Warden Governance Engine is a high-fidelity state-machine based governance framework designed to enforce engineering standards and maintain a provable audit trail through a Zero-Knowledge (ZK) interaction model.

## 🏗️ Architecture: The Service-Context Model

Warden operates on a decoupled **Anchor + Proxy** architecture, separating the governance logic from the project context.

### 1. The Central Engine (Mechanism)
The core logic resides in a central installation (the `ENGINE_ROOT`). This includes:
- **`warden.js`**: The executor that parses state machines and proxies commands.
- **`oracle.js`**: The knowledge layer providing protocol guidance and behavioral certification.
- **`path_resolver.js`**: The deterministic logic that manages path mapping between the engine and the target.

### 2. The Project Anchor (Context)
A hidden `.warden/` directory at the project root acts as the "Anchor." It contains:
- **`state/`**: The active governance cycle and the immutable `session.log` audit trail.
- **`registry/`**: Project-specific overrides for standards, glossary, and attributes.
- **`patches/`**: A record of the "Deltas" produced during governance turns.

### 3. The Proxy (Bridge)
A lightweight `warden` script in the project root forwards commands to the central engine, automatically injecting the correct project context. This allows Warden to be omnipresent but non-intrusive.

## 🚦 Operational Guidance

Warden is designed around the principle of **Atomic Turns**. Every engineering cycle follows a deterministic lifecycle.

### 1. Project Injection (Installation)
#### clone and set env
```bash
git clone https://github.com/apnex/warden
export WARDEN_ROOT=$PWD/warden
```

#### register target project
```bash
cd <target/project/dir>
$WARDEN_ROOT/warden system init
```

#### launch cli
```bash
opencode 
```

#### bootstrap prompt
```text
You are the Engineer in this session.
To initialize the environment and protocols, execute:
./warden init ONBOARD_V4 "Project Induction"
```

### 3. Development Cycles (GSD)
Most work is performed using the Gated Sequential Development (`GSD`) protocol:
- **SURVEY**: Assess the current state and dependencies.
- **PLAN**: Draft a technical blueprint and secure Director approval.
- **EXECUTE**: Perform work via `./warden exec "<cmd>"`.
- **VERIFY**: Present deliverables for final audit.
- **FINALIZE**: Synchronize documentation and close the cycle.

### 4. Cognitive Halts
If the engine stops and says **"Await Director Input,"** stop all work. This is a deliberate turn boundary designed to ensure alignment before high-stakes transitions.

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

### Component Dashboard

| Component | Purpose | Status |
|:---|:---|:---|
| `engine/warden.js` | API-Driven State-Machine Parser and Enforcement Engine. | **Production** |
| `engine/path_resolver.js` | Authoritative path mapping for root-less execution. | **Production** |
| `engine/mission.js` | Standardized Mission Briefing artifact generator. | **Production** |
| `engine/report.js` | Unified high-fidelity reporting engine (Audit, Telemetry, PIR). | **Production** |
| `engine/backlog.js` | Lifecycle management for remediation items and technical debt. | **Production** |
| `engine/lib/handlers.js` | Decoupled Requirement Validation Logic. | **Production** |
| `engine/lib/loader.js` | Centralized Protocol Loading and Validation Proxy. | **Production** |
| `docs/generate_readme.js` | Technical architecture and README generator. | **Production** |
| `docs/finalizer.js` | Release orchestration and artifact synchronization. | **Production** |
| `validation/validate_schema.js` | Structural Linter for Protocol state machines. | **Production** |
| `validation/verify_integrity.js` | System-wide Audit tool for protocol and component fidelity. | **Production** |
| `validation/audit_standards.js` | Authoritative scanner for system standard violations. | **Production** |
| `validation/test_audit.js` | Self-testing utility for the Standards Auditor. | **Production** |

---

## ⚙️ Core Capabilities

### engine/warden.js
- **Engine Features:** `Self-Healing`, `Safe Protocol Lookup`, `Session Logging (exec)`

### engine/lib/handlers.js
- **Requirement Handlers:** `file_freshness`, `file_exists`, `command_log`, `regex_match_output`

### validation/validate_schema.js
- **Engine Features:** `--fix flag`, `recursive type validation`

## ⚠️ Technical Debt

- **Shared Session Log:** Currently lacks a persistent log of all executed commands, requiring Engineer prompts for some requirements.
- **State Conflict Resolution:** Dispute handling is manual via Director override.

---

## 🕒 Version History

### v0.0.3 (2026-01-20)
- Fixed ENOENT error in warden init
- Added recursive directory creation in saveStack and updateInternalAudit

### v0.0.2 (2026-01-20)
- Migrate changelogs to registry domain
- Harden finalizer against missing files

### v0.0.1 (2026-01-20)
- Test Initialization Logic

### v0.0.0 (2026-01-20)
- Baseline Initialized

---
*Generated via Warden Self-Doc Tool*
🛡️ **Maintained by Warden Governance Engine**
