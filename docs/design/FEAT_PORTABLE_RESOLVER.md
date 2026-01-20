# Design Specification: Deterministic Portable Path Resolver (V2)

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_PORTABLE_RESOLVER |
| **Concept** | CON-010 (Context-Agnostic Governance) |
| **Status** | IN_PROGRESS (Refining for IDEA-039) |
| **Domain** | Warden Core / Infrastructure |
| **Reference** | IDEA-039 (Architecture Decoupling) |

## 1. Executive Summary
This feature refactors the Warden path resolution engine to support a decoupled **Anchor + Proxy** architecture. By distinguishing between the **Engine Root** (logic) and the **Target Project Root** (context), we enable a single Warden installation to govern multiple independent projects with zero pollution and high-fidelity state isolation.

## 2. Problem Statement: The "Single-Root" Constraint
The current implementation conflates the Warden source code location with the target project's location. This prevents:
- **Global Installation**: Running one `warden` instance across many projects.
- **State Separation**: Keeping project-specific audit logs out of the engine's internal history.
- **Registry Overlay**: Overriding global SE standards with project-specific local definitions.

## 3. Solution Architecture: The Dual-Root Resolver

### 3.1 Three-Point Anchoring
The resolver identifies three distinct logical roots:
1.  **`ENGINE_ROOT`**: The immutable location of the Warden source (Engine, Core Protocols, Validation).
2.  **`TARGET_ROOT`**: The base directory of the project being governed (The Workspace).
3.  **`ANCHOR_ROOT`**: The location of the `.warden/` directory (Context Anchor). Usually equals `TARGET_ROOT`.

### 3.2 The Overlay Resolution Engine
The resolver implements a **Layered Inheritance** model for registries:
- **Local Priority**: Look for `attributes.json`, `glossary.json`, etc., in `ANCHOR_ROOT/registry/`.
- **Global Fallback**: Fall back to `ENGINE_ROOT/registry/`.
- **Immutable Core**: Protocols are ALWAYS loaded from `ENGINE_ROOT/registry/protocols/`.

### 3.3 State Firewall
- **Project State**: `active.json` and `session.log` are resolved relative to `ANCHOR_ROOT/state/`.
- **Global State**: Engine-level history is resolved relative to `ENGINE_ROOT/state/`.

## 4. Operational Requirements

### 4.1 Path-Aware Context Detection
The toolchain must detect if it is running in:
- **Local Mode**: `CWD` is the Warden Repo. `TARGET_ROOT == ENGINE_ROOT`.
- **Proxy Mode**: `CWD` has a `.warden` anchor. `TARGET_ROOT` is the external project.

### 4.2 Standard: `STD_PORTABLE_PATHS`
Mandates that 100% of system tools utilize the `resolve` object. Hardcoded relative strings (e.g., `../registry`) are prohibited and will fail integrity audits.

## 5. Implementation Strategy

### 5.1 Resolver API (Draft)
```javascript
const resolve = {
  engine: (...parts) => path.join(ENGINE_ROOT, ...parts),
  target: (...parts) => path.join(TARGET_ROOT, ...parts),
  anchor: (...parts) => path.join(ANCHOR_ROOT, ...parts),
  
  // Logic-Aware Helpers
  registry: (filename) => {
    // 1. Check Target Anchor first (Local Overlay)
    // 2. Fallback to Engine Root (Global Baseline)
  },
  state: (filename) => {
    // 1. Route to Target Anchor (Project State)
    // 2. Handle Global State redirects
  }
};
```

### 5.2 System Migration
1.  **Phase 1**: Update `path_resolver.js` to support new roots.
2.  **Phase 2**: Update `GovernanceAPI` to use the Overlay Model.
3.  **Phase 3**: Harden `warden.js` exec to maintain context through subprocesses.

---
**Status**: REFINING (IDEA-039 Implementation)  
**Author**: Engineer  
**Reference**: [CON_ARCHITECTURE_DECOUPLING.md](../../registry/concepts/CON_ARCHITECTURE_DECOUPLING.md)
