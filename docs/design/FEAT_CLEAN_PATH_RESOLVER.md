# Design Specification: Pathing Technical Debt Cleanup

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_CLEAN_PATH_RESOLVER |
| **Concept** | CON-010 (Context-Agnostic Governance) |
| **Status** | IN_PROGRESS (IDEA-039 Alignment) |
| **Domain** | Warden Core / Infrastructure |
| **Reference** | IDEA-039 (Architecture Decoupling) |

## 1. Executive Summary
This feature systematically removes legacy static path objects (`SOURCES`, `WARDEN`, `TARGETS`) and root-level constants from the system. It replaces all occurrences with the functional `resolve` API, ensuring that every tool in the Warden ecosystem adheres to the decoupled **Anchor + Proxy** architecture defined in IDEA-039.

## 2. Problem Statement: Pathing Fragmentation
The coexistence of static strings and functional resolvers creates several issues:
- **Redundancy**: Tools import multiple objects representing the same physical paths.
- **Opacity**: Static constants hide the internal logic of "Look in Target, then Engine" (Overlay Model).
- **Maintenance Debt**: Updating a physical path requires updating every static reference across the codebase.

## 3. Solution: Unified Functional API

### 3.1 The "Single Point of Truth" Principle
All path resolution MUST pass through the `resolve` object. Tools no longer ask "Where is the registry?", they ask "Resolve the registry for file X."

### 3.2 Simplified Export Schema
The new `path_resolver.js` will export only:
1.  **`ENGINE_ROOT`**: The logic anchor.
2.  **`TARGET_ROOT`**: The project context anchor.
3.  **`resolve`**: The logical path factory.

### 3.3 Translation Mapping (The Purge)
| Old Constant | New Functional Equivalent |
| :--- | :--- |
| `SOURCES.PROTOCOLS` | `resolve.registry('protocols.json')` |
| `SOURCES.ATTRIBUTES` | `resolve.registry('attributes.json')` |
| `WARDEN.ACTIVE_STATE` | `resolve.state('active.json')` |
| `WARDEN.SESSION_LOG` | `resolve.state('session.log')` |
| `SOURCES.BACKLOG` | `resolve.active('registry', 'backlog.json')` |
| `TARGETS.README` | `resolve.docs('README.md')` |

## 4. Implementation Strategy

### Phase 1: Tool-by-Tool Migration
Refactor each of the ~25 scripts to use the `resolve` object.
- **Step 1**: Update imports to `const { resolve } = require('./path_resolver');`.
- **Step 2**: Replace all legacy property access with functional calls.

### Phase 2: Resolver Cleanup
- Remove the `SOURCES`, `WARDEN`, and `TARGETS` objects from `path_resolver.js`.
- Remove legacy root aliases (`ROOT`, `ENGINE`, `REGISTRY`, `STATE`).

### Phase 3: Integrity Validation
- Run the full suite of document generators and validation audits.
- Verify that "Local Mode" and "Proxy Mode" remain unaffected.

---
**Status**: DRAFTING (GSD Cycle Active)  
**Author**: Engineer  
**Reference**: [CON_ARCHITECTURE_DECOUPLING.md](../../registry/concepts/CON_ARCHITECTURE_DECOUPLING.md)
