# Design Specification: Deterministic Portable Path Resolver

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_PORTABLE_RESOLVER |
| **Concept** | CON-010 (Context-Agnostic Governance) |
| **Status** | GERMINATED (Backlog: P1) |
| **Domain** | Warden Core / Infrastructure |
| **Reference** | IDEA-032 |

## 1. Executive Summary
This feature implements a deterministic absolute path resolution engine for the Warden system. By transitioning from static relative mapping to a dynamic, anchor-based resolution model, we enable Warden to function as a portable governance subsystem within unrelated parent projects, CI/CD pipelines, and containerized environments without path breakage.

## 2. Problem Statement: The "Relative Fragility" Debt
The current `engine/path_resolver.js` relies on `__dirname` and static object exports. This creates several structural weaknesses:
- **Execution Context Sensitivity**: Tools fail if invoked from a directory depth other than the project root or `engine/`.
- **Embedding Friction**: Warden cannot be used as a git submodule or a `tools/` subdirectory in another project because its internal paths are not self-anchoring.
- **Environment Rigidity**: Mapping internal registries or state files to external paths (e.g., for container mounting) requires manual code changes.

## 3. Solution Architecture: The Discovery Hierarchy

### 3.1 The Warden Anchor (`.warden_root`)
We introduce a sentinel file/directory (`.warden_root`) to act as the internal project anchor.
- **Discovery Mechanism**: Upon initialization, the resolver performs an upward recursion from its own location until the anchor is found.
- **Result**: Warden becomes "Self-Aware" of its own root, regardless of where it is placed in a parent filesystem.

### 3.2 Dual-Root Resolution
To support embedding, the resolver provides two distinct namespaces:
1.  **`resolve.internal(subPath)`**: Resolves to Warden's core files (Registries, Engine, State). This is always relative to the `.warden_root` anchor.
2.  **`resolve.target(subPath)`**: Resolves to the **Execution Target** (the codebase being governed). This defaults to the internal root but can be overridden to point to a parent project root.

### 3.3 Multi-Layered Resolution Logic
The resolution of any path follows a strict priority:
1.  **Environment Overrides**: `WARDEN_REGISTRY_PATH`, `WARDEN_STATE_PATH`, etc. (Highest Priority).
2.  **Anchor Discovery**: The location of the `.warden_root` file.
3.  **Default Fallback**: `process.cwd()`.

## 4. Operational Capabilities

### 4.1 Path-Aware Auditing (Workspace Boundary)
The `Library Auditor` and `verify_integrity.js` will utilize the resolver to identify the **Governed Workspace Boundary**. This prevents Warden from incorrectly auditing files belonging to a parent project when it is used as a submodule.

### 4.2 Environment Variable Aliasing
Standardized environment aliases enable ZK entities to re-map the entire system topology via a single `.env` file or shell session. This is critical for **CI/CD integration** where state files might be mapped to ephemeral volumes.

## 5. Implementation Strategy

### 5.1 Resolver Factory Refactor
`path_resolver.js` will be refactored into a functional module:
```javascript
const resolve = {
  registry: (file) => path.join(INTERNAL_ROOT, 'registry', file),
  state: (file) => path.join(INTERNAL_ROOT, '.warden', 'state', file),
  // ... functional methods
};
```

### 5.2 System-Wide Adoption (STD_PORTABLE_PATHS)
A new system standard, **`STD_PORTABLE_PATHS`**, will be codified. It mandates that all system tools (Oracle, Warden, Patch, etc.) utilize the `resolve` utility rather than native `path.join` or relative string literals.

## 6. Discussion History (IDEA-032 Refinements)
- **Goal Alignment**: Confirmed that Warden's core goal is to be a portable governance container.
- **Subsystem Support**: The "Discovery Hierarchy" ensures that internal paths remain stable even when Warden is a small part of a larger, unrelated project structure.
- **Security & Integrity**: Integrating the resolver into the audit suite ensures that the "Double-Lock" on integrity is maintained across different project topologies.

---
**Status**: GERMINATED  
**Author**: Engineer  
**Ratified**: Director (2026-01-13)
