# PRY Analysis: COMPLIANCE_RPT

## 1. Overview
This document analyzes the `COMPLIANCE_RPT` deliverable within the Warden Governance framework, specifically focusing on the Zero Knowledge (ZK) entity experience, input sources, and goal alignment.

## 2. ZK Entity Guidance (How they know)
*   **Mechanism**: The generation of the report is enforced via a **Gate Requirement** in `GSD_V5` Phase 5 (`FINALIZE`).
*   **Discovery**: The protocol `registry/protocols.json` lists `compliance_report` with a pattern `DLR_COMPLIANCE_RPT`. The ZK entity must search the codebase for this string, leading to `engine/compliance.js`.
*   **Observation**: The guidance is **implicit** (Gate-driven) rather than **explicit** (Instruction-driven). The ZK entity "hits the wall" of the gate and must find the key (the script) to pass.

## 3. Inputs & Codification
The logic is codified in `engine/compliance.js`.

*   **Primary Input**: `.warden_session.log` (The raw CLI session output).
*   **Secondary Input**: `.warden_internal_audit.json` (Structured internal events).
*   **Reference Input**: `registry/goals.json` (System Goals).

The script parses the session log to identify:
1.  **Provenance**: Distinguishes between tool-generated outputs and user `echo` commands (preventing self-certification).
2.  **Completeness**: Verifies all required artifacts (via `DLR_` tags) are present.

## 4. Efficacy Analysis

| Goal | Rating | Analysis |
| :--- | :--- | :--- |
| **GOAL_GUIDE** | 🟡 Medium | The implicit nature requires the ZK entity to be proactive (search/deduce). While effective for filtering low-agency entities, it adds friction. An explicit instruction in `GSD_V5` states would reduce cognitive load. |
| **GOAL_PROTECT** | 🟢 High | The `manual_echo` detection in `compliance.js` is a robust firewall. It prevents an entity from simply "saying" they did the work. They must "do" the work (run the tool). |
| **GOAL_FIDELITY** | 🟢 High | By parsing the actual session log (`.warden_session.log`), the report reflects the *actual* history of the turn, not a sanitized version. This ensures the audit trail is bit-perfect and recoverable. |

## 5. Conclusion
The `COMPLIANCE_RPT` implementation is highly effective at Protection and Fidelity but relies on friction (implicit gates) for Guidance. This aligns with the "Integrity over Velocity" philosophy.
