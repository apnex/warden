# FEAT_STREAMLINED_ONBOARDING: Zero-Friction Induction

## 1. Context & Problem Statement
The current `ONBOARD_V4` workflow contains redundant steps and "phantom actions" (commands run outside the audit proxy) that confuse new Zero-Knowledge entities. Specifically:
1.  **Audit Gaps:** Direct execution of `node engine/onboard.js` bypasses the `warden.js` session log, causing gate failures later in the process.
2.  **Context Switching:** The "Status Loop" (Next -> Status -> Tool -> Next) is cognitively expensive.
3.  **Stale State:** Entities entering the environment with a previous "dirty" state are not blocked, leading to synchronization errors.

## 2. Strategic Objectives (IDEA-036)
-   **Eliminate Redundancy:** Automate transition information delivery via `on_enter` interactions.
-   **Enforce Audit:** Hard-block direct tool usage in active cycles; require `warden.js exec` proxying.
-   **Clean Slate:** Ensure induction always starts from a clean context by forcing the closure of existing cycles.

## 3. Technical Implementation Specification

### 3.1 Protocol Evolution: `ONBOARD_V4`
Refactoring the state machine to be more "Assistive" and less "Bureaucratic".

| State | Current Behavior | Refined Behavior |
| :--- | :--- | :--- |
| **1_HANDSHAKE** | Manual `onboard.js` | **No Change** (Initial discovery remains manual). |
| **2_ALIGNMENT** | Manual `oracle explain` (Token) -> Manual `onboard --align` | **Auto-Explain** `PRIME_DIRECTIVES` on entry. User only runs `exec "onboard --align"`. |
| **3_PLEDGE** | Manual `oracle explain` (Quiz) -> Manual `quiz pledge` | **Auto-Display** Quiz Prompt on entry. User only runs `exec "quiz pledge"`. |
| **4_ORIENTATION** | Manual `onboard --project` | **Requirement Update:** Explicitly check for `warden.js exec` command pattern in logs. |

### 3.2 Tooling Enhancements: `engine/onboard.js`
The tool must become "Governance-Aware" to prevent audit drift.

1.  **Proxy Guard:**
    -   On execution, check `.warden/state/active.json`.
    -   If `protocol_id == ONBOARD_V4`:
        -   Check for `WARDEN_PROXY_ACTIVE` environment variable (set by `warden.js exec`).
        -   If missing: **HALT** with error: "⚠️  Active Governance Cycle. Use `node engine/warden.js exec ...`".
2.  **Stale State Guard:**
    -   On initial run (Discovery mode):
        -   If `.warden/state/active.json` exists: **HALT** with error: "❌ Active Session Detected. Run `warden.js close` first."

### 3.3 Registry Updates: Canonical Intents
Legitimizing onboarding actions as registered intents to eliminate "Unknown Intent" noise.

**New Intents (`registry/intent_patterns.json`):**
-   `INT-ONB-VIEW`: `^node engine/onboard\.js$`
-   `INT-ONB-ALIGN`: `^node engine/onboard\.js --align [A-Z0-9]+$`
-   `INT-ORA-PLEDGE`: `^node engine/oracle\.js quiz pledge.*`

### 3.4 Workflow Optimization (CLI UX)
Updating `warden.js` status output to be "Action-Oriented".
-   Enhance `displayStatus` to identify the first unmet requirement.
-   **Output Enhancement:** Add `[NEXT ACTION]` prompt with specific instructions.

## 4. Verification Requirements
1.  **Schema Fidelity:** Changes to `ONBOARD_V4.json` must pass `validate_schema.js`.
2.  **Audit Fidelity:** Verify that all `exec` calls are correctly attributed in `session.log`.
3.  **Boundary Enforcement:** Dry-run the stale state guard to ensure a clean start for all users.
