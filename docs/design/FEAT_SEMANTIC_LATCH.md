# Design Specification: Semantic Latching (The Handshake)

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_SEMANTIC_LATCH |
| **Concept** | CON-008 (Active Semantic Latching) |
| **Status** | ACTIVE |
| **Domain** | Governance / Interaction Design |
| **Reference** | IDEA-034 |

## 1. Executive Summary
This feature implements "Active Semantic Latching" to prevent Velocity Bias in Zero-Knowledge (ZK) entities. It transforms passive textual guidance into physical state-machine gates that require the entity to parse, internalize, and echo a specific "Latch Token" before proceeding.

## 2. Problem Statement
ZK entities often treat tool output as "ephemeral context" rather than "authoritative instructions." This leads to the bypass of negative constraints (like "Wait for instructions") when the entity's internal "Completion Drive" or external backlog items present a higher probabilistic weight.

## 3. Solution Architecture: The Semantic Handshake
The Semantic Handshake enforces a hard halt by requiring a specific, context-dependent response that cannot be hallucinated or bypassed without satisfying the Warden's regex requirements.

### 3.1 Component: The Authority (`engine/onboard.js`)
The induction/onboarding tool is modified to emit a high-contrast banner and a mandatory execution string. This command acts as the "Latch Key."

**Standard Standby Token:** `[DLR_ACK_STANDBY]`

### 3.2 Component: The Gate (`registry/protocols.json`)
The protocol state machine is updated to include a `regex_match_output` requirement for the Latch Token. This physically blocks transition triggers (`next`) until the token is recorded in the session journal.

## 4. Operational Workflow
1.  **State Initialization**: System enters a "Holding Pattern" state.
2.  **Authority Emission**: Tool outputs the Latch Token instruction.
3.  **Entity Internalization**: The ZK entity reads the output and recognizes the mandatory echo.
4.  **Semantic Latch**: Entity executes the `echo` command via `warden.js exec`.
5.  **Gate Release**: Warden detects the token in the log and permits the `next` transition.

## 5. Success Metrics
*   **Internalization**: 100% of ZK entities must acknowledge the standby state before induction closure.
*   **Zero-Bypass**: No state transition can occur if the Latch Token is missing from the current turn sequence.
