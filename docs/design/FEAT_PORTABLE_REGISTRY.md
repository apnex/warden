# Feature: Portable Registry & Native Project Governance (FEAT_PORTABLE_REGISTRY)

**Status:** APPROVED
**Concept:** CON-010 (Context-Agnostic Governance)
**SQA Anchors:** robustness, performance_efficiency, resilience

## 1. Problem Statement
The Warden governance system is currently "self-centric." It pins all state, ideas, and logs to its own internal root directory. This prevents the system from governing external projects natively, leading to state collisions and a lack of provenance within the target project's repository.

## 2. Solution: Target-Aware Path Resolution
Implement a dynamic path resolution layer that detects the presence of a `WARDEN_TARGET` environment variable. If present, the system will shift its operational focus (State, Registry, History) to the target project root.

### 2.1 Refactored Component: `path_resolver.js`
*   Introduce `resolve.active()`: A master resolver that prioritizes `WARDEN_TARGET` over the internal `ROOT`.
*   Map all standard directories (registry, docs, history, .warden) to the active project root.

### 2.2 Tooling Updates
*   **`warden.js`**: Update state file constants to use `resolve.active()`.
*   **`idea.js` / `concept.js`**: Redirect JSON storage to the target project's `registry/` directory.
*   **`patch.js`**: Ensure snapshots and patches are stored in the target project's `history/` and `.warden/shadow/` directories.

## 3. Impact
This change enables **Governance Sovereignty** for projects like RLNC. It ensures that the "Understanding" (Ideas/Concepts) and "Execution" (State/Patches) are stored alongside the source code, creating a complete, portable, and verifiable engineering package.
