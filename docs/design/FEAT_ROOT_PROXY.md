# Feature Specification: Root Governance Proxy & Dynamic Instructions

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_ROOT_PROXY |
| **Concept** | CON-010 (Context-Agnostic Governance) |
| **Status** | DRAFTING |
| **Domain** | Warden Core / UX |
| **Reference** | FEAT_PROJECT_INJECTION |

## 1. Executive Summary
This feature introduces a root-level `warden` proxy for the Warden project and implements a dynamic instruction rewriting mechanism. By treating the synthesized `protocols.json` as a source for dynamic transformation, we ensure governance instructions always refer to the most appropriate execution method (local proxy vs. direct engine call) based on the active project context.

## 2. Problem Statement
1. **Inconsistency**: The Warden project root lacks the `./warden` proxy script used by its fleet, forcing a deviation in developer interaction.
2. **Instruction Drift**: Modular protocols contain hardcoded engine paths. When these are compiled into the `protocols.json` build artifact and displayed in target projects, they are contextually incorrect.
3. **Onboarding Friction**: Copy-pasting instructions from `warden status` fails in target projects because they point to internal engine paths.

## 3. Proposed Solution

### 3.1 Warden Project Root Proxy
Inject a `warden` proxy script into the Warden project root, ensuring the engine "eats its own dog food" and follows the Proxy-First standard.

### 3.2 Dynamic Instruction Rewriting (Runtime)
Instead of modifying the modular protocol library (which would be fragile), we will modify the display logic in `engine/warden.js`.
- **Mechanism**: A `rewriteInstruction(text)` helper will be applied to all requirement instructions and enter/exit banners.
- **Logic**: 
    - Detect `node engine/warden.js`.
    - If a local `./warden` proxy exists, rewrite to `./warden`.
    - Detect `node engine/oracle.js`.
    - Rewrite to `./warden oracle` (standardizing the entry point).

### 3.3 Oracle Command Passthrough
Add a native `oracle` command to `warden.js` that proxies arguments to `engine/oracle.js`, enabling the `./warden oracle ...` syntax.

## 4. SQA Anchors
- **Usability**: Facilitates error-free copy-pasting of instructions.
- **Maintainability**: Avoids hardcoding context-specific paths in the modular protocol library.
- **Compliance**: Enforces the Proxy-First interaction model across the entire fleet, including the engine project.

## 5. Implementation Plan
1. **Phase 1**: Add `cmdOracle` passthrough to `engine/warden.js`.
2. **Phase 2**: Implement `rewriteInstruction` helper in `engine/warden.js`.
3. **Phase 3**: Update `displayStatus` and `cmdNext` to use the rewriter.
4. **Phase 4**: Inject the `warden` proxy into the Warden root.
5. **Phase 5**: Verification of dynamic adaptation in both Warden root and a target project context.
