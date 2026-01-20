# Design Specification: Project Injection Workflow

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_PROJECT_INJECTION |
| **Concept** | CON-010 (Context-Agnostic Governance) |
| **Status** | IN_PROGRESS (IDEA-039 Implementation) |
| **Domain** | Warden Core / Onboarding |
| **Reference** | IDEA-039 (Architecture Decoupling) |

## 1. Executive Summary
This feature implements the `warden init` command, providing a formal "Injection" mechanism to bring a target directory under Warden Governance. It operationalizes the **Anchor + Proxy** model by automatically scaffolding the `.warden/` anchor and generating a lightweight proxy script in the project root.

## 2. Problem Statement: Manual Onboarding Friction
Currently, bringing a new project under governance requires manual creation of the `.warden/` directory and complex environment variable configuration to point to the central engine. This creates:
- **High Barrier to Entry**: Potential for incorrect manual setup.
- **Inconsistency**: Fragmented project structures across different governed projects.
- **Portability Debt**: Difficulty in sharing the governance engine across multiple developer environments.

## 3. Solution Architecture: The `init` Workflow

### 3.1 The Scaffolding Engine
The `init` command will automate the creation of the standard anchor topology:
- `.warden/state/`: Active protocol cycles and session logs.
- `.warden/registry/`: Local glossary, attributes, and standards overrides.
- `.warden/patches/`: Reversible logic changes.
- `.warden/shadow/`: Transactional workspace snapshots.

### 3.2 The Proxy Generation
A `warden` executable (shell/Node script) is injected into the project root.
- **Mechanism**: The proxy detects the absolute path to the `ENGINE_ROOT`.
- **Function**: It executes `node <ENGINE_ROOT>/engine/warden.js` while automatically injecting `WARDEN_TARGET_ROOT=$(pwd)`.

### 3.3 Engine-Level Registration
The new project is registered in the central `ENGINE_ROOT/state/projects.json` file, allowing the engine to maintain a global inventory of governed domains.

## 4. Operational Requirements

### 4.1 CLI Interface
`node engine/warden.js system init [--target <path>]`
- Defaults to `CWD` if no target is specified.
- Fails if a `.warden` directory already exists (unless `--force` is used).

### 4.2 Template Seeding
The command will seed the `.warden/registry/` with baseline structural JSON files:
- `goals.json`: Initialized with a system induction goal.
- `backlog.json`: Initialized with an empty item list.

## 5. Implementation Strategy
1.  **Phase 1**: Update `warden.js` with `cmdSystemInit`.
2.  **Phase 2**: Implement `scaffoldAnchor(targetPath)` logic.
3.  **Phase 3**: Implement `generateProxy(targetPath)` logic.
4.  **Phase 4**: Verification via cross-project governance test.

---
**Status**: DRAFTING (GSD Cycle Active)  
**Author**: Engineer  
**Reference**: [CON_ARCHITECTURE_DECOUPLING.md](../../registry/concepts/CON_ARCHITECTURE_DECOUPLING.md)
