# High-Fidelity Concept: Automated Remediation Engine (Warden Fixer)

| Metadata | Value |
| :--- | :--- |
| **Concept ID** | CON-005 |
| **Source Idea** | IDEA-026 |
| **Status** | RATIFIED |
| **Domain** | Governance / Operational |
| **Standard** | High-Fidelity Concept Standard |

## 1. Provenance
This concept originated from **IDEA-026**, refined through a collaborative dialogue between the Director and the Engineer to address technical regressions, cognitive friction for ZK entities, and the accumulation of governance debt.

## 2. Verbose Context
As the Warden system evolves, it encounters "metabolic friction"—technical debt in the form of referential integrity gaps, schema drift in deliverables, and the accumulation of ephemeral state files. Previously, these required manual "janitorial" implementation turns. The **Warden Fixer** is designed to automate these governance maintenance tasks, allowing ZK entities to focus on logic implementation while the system maintains its own structural integrity.

## 3. Architectural Blueprint

### Component #1: Registry Repair (Referential Integrity)
*   **Purpose**: To ensure the `protocol_library` and `deliverable_registry` are always in sync.
*   **Mechanism**: A bi-directional scan that detects required but missing `DLR_` tokens.
*   **Remediation Levels**:
    *   **Fuzzy Matching**: Corrects near-miss IDs (e.g., `DLR_ACK_PLAN` -> `DLR_PLN_ACK`).
    *   **Stub Generation**: Automatically injects placeholder entries in `deliverables.json` for new, undocumented requirements.

### Component #2: Schema Alignment (High-Fidelity Patching)
*   **Purpose**: To harden the quality of generated deliverables against High-Fidelity schemas.
*   **Mechanism**: Cross-references implementer reports (e.g., `engineer_report.json`) against the registry.
*   **Remediation**: Injects missing fields and corrects data structures using the `oracle.js blueprint` logic, preserving Engineer content while ensuring schema compliance.

### Component #3: Governance Debt Cleanup (Centralized State Pattern)
*   **Purpose**: To maintain environmental stability and protect "Core DNA".
*   **Mechanism**: Enforces a **Centralized State Pattern** by moving all ephemeral execution files to `.warden/state/`.
*   **Whitelisting**: Strictly protects `registry/` and its subdirectories. Only `.warden/state/` and `.warden/shadow/` are eligible for pruning.

### Component #4: Automatic SQA Mapping (Socratic Guidance)
*   **Purpose**: To bridge the architectural awareness gap for ZK entities.
*   **Mechanism**: Keyword-to-Attribute (K2A) heuristic mapping based on `DLR_BRF_MISSION` content.
*   **Socratic Interaction**: Instead of auto-pilot generation, the engine presents "Candidate Attributes" and **requires** the Engineer to provide a "Strategic Rationale" before generating the validation command.

## 4. Decision Log
*   **Active vs. Passive**: Decided on an **Active Command** (`warden.js remediate`) to ensure explicit audit fidelity and Director visibility before system changes.
*   **Metadata Isolation**: Decided to strictly limit the Fixer to **Governance Metadata**. It is prohibited from modifying implementation/tooling code to prevent "Runaway Logic" scenarios.
*   **Centralization**: Moving execution state out of `engine/` and `registry/` was identified as critical for preventing directory drift and accidental pollution of immutable metadata.

## 5. Success Metrics
1.  **Integrity**: 0% broken references in `verify_integrity.js` after running `remediate --registry`.
2.  **Fidelity**: 100% of implementer reports match High-Fidelity schemas after `remediate --schemas`.
3.  **Efficiency**: ZK entities can transition from Mission Brief to Plan 20% faster due to Socratic SQA guidance.
4.  **Stability**: Zero pollution of `registry/` subdirectories during cleanup operations.
