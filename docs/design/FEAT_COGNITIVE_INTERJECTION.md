# Design Specification: Metadata-Driven Cognitive Interjection

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_COGNITIVE_INTERJECTION |
| **Concept** | CON-007 (Metadata-Driven Cognitive Interjection) |
| **Status** | LIVE |
| **Domain** | Governance / Interaction Design |
| **Reference** | IDEA-033 |

## 1. Executive Summary
This feature implements a mechanism to inject "Active JIT Guidance" and "Semantic Brakes" directly into the Warden Governance Engine. It physically prevents "Velocity Bias" in Zero-Knowledge entities by forcing visual interrupts and mandatory qualitative analysis during off-protocol actions.

## 2. Problem Statement
Zero-Knowledge (ZK) Entities consistently exhibit "Velocity Bias"—interpreting complex, multi-step instructions as "Macro-Commands" to be executed in a single turn. The current "Passive" gate enforcement captures the breach but does not prevent the behavior. Furthermore, ZK entities often bypass the Director by delivering artifacts to the governance system without performing the required external echo for review.

## 3. Solution Architecture: The Socratic Brake & JIT Presentation

### 3.1 The Socratic Brake (Exec Intercept)
When a command is executed via `warden.js exec`, the system attempts to resolve a Canonical Intent. If no match is found, the system triggers a **Hard Halt**, requiring a mandatory `--justify` flag to proceed. This captures qualitative provenance as a `DLR_AUD_INTERJECTION` token.

### 3.2 Turn-Boundary Interrupts (Presentation Layer)
To ensure maximum impact on an AI's next-token generation, the Warden emits a **Cognitive Halt** sequence at the very end of a transition turn (`warden.js next`).

#### Sequence Components:
1.  **Visual Banner**: A single-line, high-contrast signal (e.g., `🛑 [STOP] DIRECTOR AUTHORIZATION REQUIRED 🛑`).
2.  **JIT Guidance**: Automatic execution of `oracle.js explain` for the new state.
3.  **Halt Token**: Emission of a unique `[COGNITIVE_HALT]` string to physically break the completion-bias loop.

### 3.3 The "Double-Lock" Delivery Handshake (Handshake Logic)
For states requiring Director approval, the Warden implements an active block on lifecycle advancement until external confirmation is received.

#### 3.3.1 Two-Turn Enforcement
The handshake physically enforces a **Turn Boundary**. An entity cannot generate a deliverable and transition to the next state in the same interaction turn.
- **The Wait**: Upon completion of implementation, the system enters a "Pending Acknowledgement" state.
- **The Block**: Any attempt to execute `warden.js next` is met with a hard halt until the session journal records a Director input.

#### 3.3.2 Log Provenance & Temporal Anchoring
To prevent "Chaining" (where an entity might try to echo its own approval before the transition), the Warden performs **Temporal Verification**:
- **Scan**: The engine scans `.warden/state/session.log` for any command containing an `_ACK` pattern.
- **Anchor**: The acknowledgement must have a timestamp **greater than** the `last_transition` time of the current state.
- **Authenticity**: This ensures that the evidence of approval was created *after* the work was finished and presented, effectively requiring a fresh external turn.

#### 3.3.3 The "Shadow State" Prevention
By validating the presence of the `_ACK` *before* the transition logic is allowed to run, the system eliminates the "Race Condition" where an entity might leap to a new state while the Director is still reviewing the previous one.

## 4. Operational Workflow
1.  **Transition**: Agent runs `warden.js next`.
2.  **State Change**: System updates state.
3.  **Interjection**: System detects `interaction.on_enter`.
4.  **Output**: System output is flooded with the concise banner and the Oracle Guidance, ending with the `[COGNITIVE_HALT]` token.

## 5. Success Metrics
*   **Breach Reduction**: >50% reduction in "Actor Conflation" breaches.
*   **Director Visibility**: 100% of deliverables are echoed to the Director before state advancement.
*   **Flexibility**: New behavioral rules can be deployed via `protocols.json` without core engine refactoring.

---
**Status**: GERMINATED (Refinement)  
**Author**: Engineer  
**Ratified**: Director (2026-01-13)