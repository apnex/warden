# Design Specification: Metadata-Driven Induction (ONBOARD_V4)

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_METADATA_INDUCTION |
| **Concept** | CON-008 (Metadata-Driven Governance) |
| **Status** | LIVE |
| **Domain** | Onboarding / Governance |
| **Dependency** | FEAT_ZK_FIDELITY |

## 1. Executive Summary
This feature implements a strictly metadata-driven onboarding lifecycle. By refactoring the monolithic induction process into a discrete 5-stage state machine (`ONBOARD_V4`) and transforming `onboard.js` into a passive renderer, we align the system's initialization path with `STD_METADATA_PRIMACY`.

## 2. Technical Dependencies
- **FEAT_ZK_FIDELITY**: Provides the underlying "Prime Directives" and "Turing Gate" requirements that satisfy the transition from alignment to orientation.

## 3. Solution Architecture

### 3.1 The 5-Stage State Machine
The induction process is no longer a procedural script; it is a governed lifecycle within `registry/protocols/ONBOARD_V4.json`:

1.  **`0_IDLE`**: Initial system state.
2.  **`1_HANDSHAKE`**: Presentation of core principles and role definitions.
3.  **`2_ALIGNMENT`**: Verification of ZK Fidelity through the retrieval and matching of a session-based alignment token.
4.  **`3_PLEDGE`**: Mandatory behavioral verification via "The Pledge" quiz.
5.  **`4_ORIENTATION`**: Presentation of project architecture, active backlog, and strategic intent.

### 3.2 The Passive Renderer Pattern (`onboard.js`)
The `engine/onboard.js` tool has been stripped of all governance logic. It now functions as a high-fidelity display layer that:
1.  Queries the `GovernanceAPI` for the active `ONBOARD_V4` state.
2.  Fetches instructions and requirement status from the protocol metadata.
3.  Renders the specific visual domain (Induction, Alignment, Pledge, or Project) corresponding to that state.

## 4. Operational Workflow
- **State Blocking**: If an entity attempts to access Orientation (`onboard.js --project`) while in the Alignment phase, the tool will refuse to render the project details, as the state machine requirements are not met.
- **Verification Gates**: Transitions between states are enforced by `warden.js`, ensuring that alignment tokens and quiz certificates are physically present in the `.warden/state/` directory before the lifecycle advances.

## 5. Success Metrics
- **Logic Decoupling**: 100% of governance rules migrated from tool code to registry metadata.
- **Audit Fidelity**: All induction actions are captured as canonical intents in the session journal.
- **ZKE Continuity**: Future entities can modify the induction path by updating the JSON protocol without altering the execution tools.

---
**Status**: LIVE  
**Author**: Engineer  
**Ratified**: Director (2026-01-13)
