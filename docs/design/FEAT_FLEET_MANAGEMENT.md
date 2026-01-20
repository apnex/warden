# Design Specification: Project Fleet Management

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_FLEET_MANAGEMENT |
| **Concept** | CON-010 (Context-Agnostic Governance) |
| **Status** | IN_PROGRESS (IDEA-039 Implementation) |
| **Domain** | Warden Core / Fleet Operations |
| **Reference** | IDEA-039 (Architecture Decoupling) |

## 1. Executive Summary
This feature implements the **Fleet Management** layer of the Warden Engine. It provides the CLI tools necessary to manage the lifecycle of all registered projects, enabling bulk auditing, inventory maintenance (pruning), and high-level status reporting for the entire governed ecosystem.

## 2. Problem Statement: Visibility into Governed Domains
With the transition to a decoupled architecture, the Warden Engine now serves as a central hub. However, there is currently no way to:
- **Enumerate** the projects under governance.
- **Verify** the health of the project "Fleet."
- **Cleanup** stale or moved project entries in the central inventory.

## 3. Solution Architecture: Fleet Operations CLI

### 3.1 Global Inventory API
- **Logic**: Centralize access to `state/projects.json` via the `resolve.state('global', 'projects.json')` path.
- **Registration**: Automatically hook into the `system init` workflow (Completed in Phase 2).

### 3.2 Command Suite (`warden system ...`)
1.  **`list`**: Tabular view of all registered projects.
    - Columns: Name, Version (from project anchor), Active Protocol, Last Heartbeat.
2.  **`prune`**: Interactively or automatically remove entries where the `TARGET_ROOT` is no longer reachable.
3.  **`heartbeat`**: A "Quick Scan" that validates the cryptographic integrity of all `.warden` anchors in the fleet.

## 4. Operational Requirements

### 4.1 Resolver Hardening
Update `path_resolver.js` to explicitly support the `global` state logical target.

### 4.2 Error Handling
Bulk operations must be resilient. If one project's anchor is corrupted, it should be logged as a "Breach," but the operation should continue to the next project.

## 5. Implementation Strategy
1.  **Phase 1**: Update `path_resolver.js` for global state.
2.  **Phase 2**: Implement `cmdSystemList` in `warden.js`.
3.  **Phase 4**: Implement `cmdSystemPrune` and `cmdSystemHeartbeat`.
4.  **Phase 5**: Update `finalizer.js` to include a fleet health summary.

---
**Status**: DRAFTING (GSD Cycle Active)  
**Author**: Engineer  
**Reference**: [CON_ARCHITECTURE_DECOUPLING.md](../../registry/concepts/CON_ARCHITECTURE_DECOUPLING.md)
