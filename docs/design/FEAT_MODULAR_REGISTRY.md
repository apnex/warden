# Design Specification: Modular Protocol Registry

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_MODULAR_REGISTRY |
| **Concept** | CON-008 (Modular Governance Architecture) |
| **Status** | GERMINATED (Backlog: P1) |
| **Domain** | Governance / System Architecture |
| **Reference** | IDEA-030 |

## 1. Executive Summary
The Modular Protocol Registry architecture transitions the Warden system from a monolithic governance definition (`protocols.json`) to a distributed, file-per-protocol model. This shift eliminates file bloat, reduces the risk of global syntax regressions, and provides a scalable foundation for complex metadata-driven governance.

## 2. Problem Statement
The current `registry/protocols.json` is a monolithic artifact (~1500+ lines). This creates several friction points for Zero-Knowledge (ZK) entities:
- **Cognitive Load**: Parsing large files increases the risk of misinterpretation.
- **Structural Fragility**: A single syntax error in one protocol invalidates the entire governance library.
- **Merge Complexity**: Parallel development on separate protocols creates high friction during integration.
- **Audit Velocity**: Reviewing broad changes in a monolithic file is less efficient than reviewing atomic file updates.

## 3. Solution Architecture: "Virtual Protocol Library"
We implement a **Hybrid Late-Binding** and **Manifest-Driven** architecture.

### 3.1 Directory Structure
All protocol definitions are moved to a dedicated directory:
- `registry/protocols/`
  - `GSD_V5.json`
  - `ONBOARD_V4.json`
  - `IDEA_V1.json`
  - ...etc.

### 3.2 The Library Spine (`index.json`)
A lean index file persists the system-wide metadata and bootstrap instructions.
- `registry/protocols/index.json`
```json
{
  "meta": { "title": "System Protocol Library", "version": "2.1.0" },
  "bootstrap": { "instruction": "node engine/onboard.js" }
}
```

### 3.3 The Integrity Manifest (`library_manifest.json`)
To ensure bit-perfect fidelity, a build-artifact manifest tracks the state of all modular files.
- **Generation**: Triggered by `audit_library.js --sync` during the GSD Finalize phase.
- **Content**:
```json
{
  "ONBOARD_V4": {
    "file": "registry/protocols/ONBOARD_V4.json",
    "version": "4.1.0",
    "hash": "sha256:7f8d9a...",
    "updated": "2026-01-13T12:00:00Z"
  }
}
```

## 4. Interaction Patterns

### 4.1 Late-Binding Resolution (Option 2)
The `GovernanceAPI` will prioritize loading the manifest to identify file paths. If a protocol is requested, the API "Late-Binds" by reading the specific JSON file from the directory. This ensures "Plug-and-Play" capability where dropping a new `.json` file into the folder makes it available to the engine.

### 4.2 Virtual Join Logic
Upon initialization, the `GovernanceAPI` performs a **Virtual Join**:
1. Load `index.json` (Spine).
2. Load `library_manifest.json` (Integrity Baseline).
3. Iterate through files and reconstruct the `protocol_library` object in memory.

## 5. Implementation Strategy & Migration

### 5.1 The Library Auditor (`audit_library.js`)
A new validation tool will be developed to enforce:
- **Referential Integrity**: All `sub_protocol_complete` IDs must exist in the library.
- **Schema Compliance**: Every file must strictly adhere to `protocol.schema.json`.
- **Fidelity Matching**: Manifest hashes must match the on-disk state.

### 5.2 Migration Phase
1. **Parallel Support**: Maintain the monolithic `protocols.json` as a "Flat View" build-artifact.
2. **Synchronization**: The Library Auditor will ensure the "Flat View" and the "Modular View" are bit-identical during the transition.
3. **Deprecation**: Once tooling stability is verified, the monolithic file will be removed, leaving the modular directory as the single source of truth.

## 6. Discussion History (IDEA-030 Refinements)
- **Director Feedback**: Emphasized the need for a granular integrity check (hashing) and a safe migration path using the flat copy.
- **Engineer Analysis**: Identified that Option 2 (Late-Binding) provides the best balance of simplicity and flexibility, while Option 3 (Manifest) provides the necessary performance and audit fidelity.
- **ZKE Continuity**: The inclusion of hashes in the manifest ensures that future ZK entities can detect "Shadow Changes" (unauthorized file modifications) even if the global system hash remains unchanged.

---
**Status**: GERMINATED  
**Author**: Engineer  
**Ratified**: Director (2026-01-13)
