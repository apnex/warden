# Feature Specification: Root Governance Proxy & Refined Self-Healing

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_ROOT_PROXY |
| **Concept** | CON-010 (Context-Agnostic Governance) |
| **Status** | DRAFTING |
| **Domain** | Warden Core / UX |
| **Reference** | FEAT_PROJECT_INJECTION |

## 1. Executive Summary
This feature establishes a root-level `warden` proxy for the Warden project via a self-healing protocol. It ensures that the proxy is automatically maintained in the engine root while strictly preventing pre-emptive scaffolding in target projects that have not yet been initialized.

## 2. Problem Statement
1. **Inconsistency**: The Warden project root requires a `./warden` proxy to align with fleet standards.
2. **Collision with Init**: The current self-healing logic creates proxies and anchor directories in target projects before `warden system init` is invoked, causing "Anchor already exists" failures.

## 3. Proposed Solution

### 3.1 Scoped Self-Healing
Modify the `ensureProxyExists` trigger. It will only execute if `TARGET_ROOT` is identical to `ENGINE_ROOT`. This ensures the Warden project always has its proxy without affecting target projects.

### 3.2 Gated State Initialization
The engine currently attempts to create `.warden/state` on every startup. This will be modified to only run if `fs.existsSync(resolve.anchor())` is true. This preserves the "Zero-Knowledge" state of a fresh directory until `system init` is explicitly called.

## 4. SQA Anchors
- **Robustness**: Protects the initialization flow of target projects.
- **Compliance**: Maintains the Proxy-First standard in the Engine root.

## 5. Implementation Plan
1. **Phase 1**: Restrict `ensureProxyExists` to `ENGINE_ROOT` context.
2. **Phase 2**: Gate `.warden/state` creation behind anchor detection.
3. **Phase 3**: Verify `warden system init` functionality in clean environments.
