# IDEA-039: Architecture Decoupling (Formal Specification)

## 1. Overview & Vision
This proposal defines the formal separation between the **Warden Governance Engine** (the technical logic and protocol library) and the **Target Project** (the functional context being governed). 

The goal is to transition Warden from a "Single-Root" architecture to a **Service-Context** architecture. This ensures that Warden can govern multiple projects seamlessly from a central installation while maintaining the strict audit isolation and project-specific flexibility required for high-fidelity engineering.

### Core Philosophy: Cognitive Isolation
> "The engine provides the process; the project provides the purpose. Neither shall pollute the other's structural integrity."

---

## 2. Domain 0: Warden Installation (The Anchor + Proxy Pattern)

Warden installation is reimagined as a **Governance Injection** rather than a standard code dependency. This is achieved through the **Anchor + Proxy** model.

### 2.1 Options Analysis Matrix
The following options were evaluated for their ability to support multi-project decoupling:

| Option | Decoupling | Ease of Use | Maintenance | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **A. Anchor & Proxy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **SELECTED** |
| **B. NPM Dist** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | - |
| **C. Git Submodule** | ⭐ | ⭐⭐⭐ | ⭐ | - |
| **D. Sidecar/Docker** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ | - |
| **E. Global Symlink** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | - |

### 2.2 The "Anchor + Proxy" Mechanism
1.  **The Central Engine (The "Brain"):** Resides in a single, protected location on the host machine (e.g., `/opt/warden/`). It contains the logic (`warden.js`, `oracle.js`), the validation suite, and the immutable protocol library.
2.  **The Anchor (`.warden/`):** A hidden directory at the root of the Target Project. It contains the project's unique "governance DNA"—its state, its local registry, and its audit history.
3.  **The Proxy (`warden`):** A minimal script (e.g., `warden.sh` or a shell alias) placed in the project root. It forwards developer intent to the Central Engine while providing the project's root path as a context pointer.

**Example Injection Workflow:**
```bash
# Developer initiates governance in a new project
cd my-new-app
warden init --anchor

# Result: 
# Creates .warden/state, .warden/registry
# Adds local 'warden' proxy script
```

---

## 3. Domain 1: State Separation

True decoupling requires a "State Firewall" to prevent engine-level telemetry from polluting project-level audit trails.

### 3.1 Dual-Homed State Management
The Engine manages two distinct state categories based on the current execution mode:

1.  **Engine State (Global Metadata):**
    *   **Path:** `ENGINE_ROOT/state/`
    *   **Content:** `projects.json` (registry of all managed projects), `global_breach_registry.json`, and engine-wide configuration.
    *   **System Governance Changelog:** Located in `ENGINE_ROOT/history/governance_changelog.json`. Tracks the evolution of the Warden Engine itself.
2.  **Project State (Local Context):**
    *   **Path:** `TARGET_ROOT/.warden/state/`
    *   **Content:** `active.json` (Current protocol stack), `session.log` (The bit-perfect audit journal), and `internal_audit.json` (Verified event history).
    *   **Project Changelog:** Located in `TARGET_ROOT/.warden/changelog.json`. Tracks application-level changes (features, fixes) and serves as the data source for generated `docs/CHANGELOG.md`.

### 3.2 Behavior Example
When running `warden next` in a project, the engine reads the **Project State** to find the current transition gate, but writes a record of the engine version used to the **Engine State** for central tracking.

---

## 4. Domain 2: Registry Hierarchy (Layered Inheritance)

The Registry is the "Source of Truth." In a decoupled model, this truth is layered to support global SE standards and project-specific requirements.

### 4.1 The Overlay Resolution Model
When a tool (e.g., `oracle.js`) looks for a term, standard, or attribute, it follows a strict resolution chain:
1.  **Phase 1 (Local/Mutable):** Check `TARGET_ROOT/.warden/registry/`. If found, this definition overrides the global one.
2.  **Phase 2 (Global/Immutable):** Fall back to `ENGINE_ROOT/registry/`.

### 4.2 Immutable Core Protocols
To prevent "Governance Drift," the core protocols (the "Rules of the Game") reside exclusively in the **Engine Registry** and are immutable for the project.
*   **Engine Registry:** `protocols/`, `standards.json` (Global), `glossary.json` (SE Foundation), `attributes.json` (ISO Quality Taxonomy).
*   **Project Registry:** `backlog.json`, `goals.json`, `ideas/`, `concepts/`, and local extensions/overrides for glossary and attributes.

**Example Override:**
A project defining a custom "Reliability" attribute in its local `attributes.json` will see that definition used by the Oracle, even though a global definition exists in the Engine.

---

## 5. Domain 3: Documentation Isolation

Documentation must reflect the project's state without mixing with the Engine's operational manual.

### 5.1 Three-Tiered Documentation Strategy
1.  **System Manuals (Engine-Level):** Operational guides for the Warden system (`ENGINE_ROOT/docs/`).
2.  **Public Project Docs (Target-Level):** Generated artifacts for the project team (`TARGET_ROOT/docs/README.md`, `BACKLOG.md`).
3.  **Governance Proofs (Anchor-Level):** High-fidelity compliance reports and protocol maps (`TARGET_ROOT/.warden/docs/`).

### 5.2 Separation of Logic and Layout
*   **Logic (Central):** Documentation generators (e.g., `docs_gen.js`) reside in `ENGINE_ROOT/engine/`.
*   **Layout (Inherited):** Default templates reside in `ENGINE_ROOT/registry/templates/`. Projects may provide local overrides in `TARGET_ROOT/.warden/registry/templates/`.

---

## 6. Domain 4: Tooling Portability (Context-Awareness)

The technical "linchpin" is a hardened `path_resolver.js` that detects the execution context dynamically.

### 6.1 Mode Detection Logic
*   **Local Mode:** If `CWD` is inside the Warden source repo, tools act upon the Engine itself.
*   **Proxy Mode:** If `CWD` contains a `.warden` anchor that is NOT the engine root, tools act as a service for that project.

### 6.2 Implementation Requirements
*   **No Absolute Paths:** All tools must use the `resolve` object to find files.
*   **Logical Path Factory:** Tools call `resolve.target('docs', 'README.md')` or `resolve.engine('protocols')`. The resolver handles the mapping to the physical filesystem based on the detected mode.
*   **Environment Injection:** The `warden.js exec` proxy must inject `WARDEN_ENGINE_ROOT` and `WARDEN_TARGET_ROOT` into the environment for all child processes to maintain context.

---

## 7. Conclusion & Next Steps
This decoupling ensures that Warden can scale from a single project to an enterprise governance solution. By separating **Mechanism** from **Context**, we achieve high-fidelity oversight with zero architectural pollution.

**Next Phase:** Promotion to `BLUEPRINT_V1` for the `path_resolver.js` refactor.
