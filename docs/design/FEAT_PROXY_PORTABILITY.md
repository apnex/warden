# FEAT_PROXY_PORTABILITY: Context-Aware Proxy Generation

## 1. Objective
Harden the Warden proxy generation to support both local portability (within the Warden root) and absolute anchoring (in target projects).

## 2. Design Specification
Modify `engine/warden.js` -> `generateProxy(targetPath)`:

- If `targetPath` equals `ENGINE_ROOT`:
  - Use `path.resolve(__dirname)` to dynamically locate the engine.
  - This allows the Warden repository to be moved or cloned without breaking the `./warden` proxy.
- Otherwise (Target Project):
  - Retain the absolute path to the global `ENGINE_ROOT`.
  - This ensures the target project maintains its link to the installed Warden engine.

## 3. Implementation Details
The `proxyContent` string template will be updated to include conditional logic for `ENGINE_ROOT` definition.

## 4. SQA Anchoring
- **Attribute**: `portability`
- **Goal**: Zero modification required when moving the Warden root directory.
- **Attribute**: `robustness`
- **Goal**: Self-healing must produce a functional proxy in all supported contexts.
