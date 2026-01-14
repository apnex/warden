# Feasibility Analysis: Compliance Audit Protocol (CAP)

## 1. Context
Warden has recently evolved to a **Three-Way Compliance Model** (Engineer Claims vs. Warden Logs -> Assessment). Currently, this is a sub-step within `GSD_V5` Phase 5 (`FINALIZE`).

## 2. Analysis of the Status Quo
*   **Friction**: ZK entities must know to create `engineer_report.json` and run `compliance.js --input` manually. This is an implicit "discovery" requirement rather than a guided process.
*   **Risk**: High cognitive load in the final phase often leads to protocol breaches (e.g., self-certifying `DLR_` tags via `echo` to close the cycle).

## 3. Options for CAP

### Option A: Standalone Protocol (CAP_V1)
*   **Structure**: `0_IDLE -> 1_CLAIM (Engineer) -> 2_EVIDENCE (System) -> 3_ASSESS (Logic) -> 4_RATIFY (Director)`.
*   **Pros**: Full active guidance. Deterministic requirements for each role.
*   **Cons**: Adds a mandatory new state machine cycle *after* the implementation cycle. Increases "Turn Friction".

### Option B: GSD Sub-Protocol (Integrated)
*   **Structure**: Expand `GSD_V5` Phase 5 into a mini-state machine.
*   **Pros**: Keeps the lifecycle unified. Ensures compliance is part of the "Close Loop".
*   **Cons**: Makes `GSD_V5` more complex.

### Option C: Dynamic Proxy (The "Warden Close" Hook)
*   **Structure**: `node engine/warden.js close` triggers a mandatory wizard that guides the ZK entity through the claims.
*   **Pros**: Lowest friction. Just-in-time guidance.
*   **Cons**: Harder to audit as a "state" in the log if the wizard is interactive.

## 4. Pros & Cons Matrix

| Feature | Status Quo | Dedicated CAP |
| :--- | :--- | :--- |
| **Guidance** | 🔴 Low (Implicit) | 🟢 High (Explicit) |
| **Fidelity** | 🟡 Medium (Self-Echoes) | 🟢 High (Validated Claims) |
| **Velocity** | 🟢 High (Fast Close) | 🔴 Low (Structured Close) |
| **ZK Readiness** | 🔴 Low (Requires Knowledge) | 🟢 High (Guided Process) |

## 5. Recommendation
Develop **Option A (CAP_V1)** as a standalone protocol but implement it such that `GSD_V5` can "delegate" to it in Phase 5. This maintains `GOAL_GUIDE` (Active Guidance) while allowing for future protocol reuse (e.g., periodic audits outside of a GSD cycle).
