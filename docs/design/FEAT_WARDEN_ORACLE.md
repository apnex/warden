# Design Specification: Universal Oracle Uplift (FEAT_UNIVERSAL_ORACLE)

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_UNIVERSAL_ORACLE |
| **Concept** | CON-011 (Dynamic Guidance Synthesis) |
| **Status** | GERMINATED (Backlog: P0) |
| **Domain** | Guidance / Knowledge Management |
| **Combined With**| FEAT_ORACLE_BLUEPRINTS |

## 1. Executive Summary
The Universal Oracle Uplift transforms the Warden Oracle from a static file-reader into a **Dynamic Knowledge Engine**. This feature implements metadata-driven discovery across all system registries and introduces a high-fidelity recursive schema parser for automated deliverable templating (Blueprints).

## 2. Problem Statement
The current Oracle implementation suffers from **Manual Debt** and **Shallow Synthesis**:
- **Brittle Discovery**: Every new registry requires code changes to the `oracle.js` search loop.
- **Guidance Gaps**: Key system elements like Intent Patterns and Backlog items are currently "invisible" to the Oracle.
- **Template Failure**: The blueprint generator cannot handle complex JSON schemas (references, conditionals), leading to low-fidelity stubs.

## 3. Solution Architecture

### 3.1 Metadata-Driven Discovery (Universal explain)
Instead of a sequential search of 5 hard-coded files, the Oracle will implement a **Global Registry Resolver**:
1.  **Registry of Registries**: A mapping of all active JSON sources in `registry/`.
2.  **Generic Pattern Matcher**: The Oracle scans all sources for the target ID.
3.  **Semantic Synthesis**: The Oracle will not just display the raw JSON; it will pull in related documentation from `docs/design/` using Markdown fragment injection.

### 3.2 Recursive Blueprint Engine (High-Fidelity Action)
The blueprint generator will be refactored into a **Recursive Schema Parser**:
- **Ref Resolution**: Automatically follows `$ref` pointers within and between files.
- **Conditional Logic**: Intelligent handling of `allOf`, `anyOf`, and `oneOf`.
- **ZKE Guidance**: Injects descriptions directly into the generated JSON as semantic comments or placeholders (e.g., `"<REQUIRED: Description from Schema>"`).

### 3.3 Preserved Lifecycle Features
The uplift must ensure zero regression for existing critical features:
- **Onboarding Quiz (The Pledge)**: Maintains the deterministic affirmation workflow.
- **Turing Gate Handshake**: Preserves the ZK Fidelity handshake logic.
- **Sandbox Isolation**: Ensures isolated logging remains active during tutorial sessions.

## 4. Operational Workflow
1.  **Explanation**: Engineer runs `node engine/oracle.js explain <ID>`. The Oracle resolves the ID across all registries and provides technical, procedural, and historical context.
2.  **Templating**: Engineer runs `node engine/oracle.js blueprint <ID>`. The Recursive Engine generates a bit-perfect JSON skeleton, including all nested requirements.
3.  **Induction**: Oracle continues to guide ZK entities through the `ONBOARD_V4` state machine.

## 5. Success Metrics
- **Match Fidelity**: 100% resolution of IDs across all registries (Protocols, Deliverables, Standards, Intents, Backlog, Attributes).
- **Blueprint Accuracy**: Generated templates successfully pass `validate_schema.js` without manual editing.
- **Zero Regression**: Onboarding and Sandbox cycles remain bit-perfect.

---
**Status**: GERMINATED  
**Author**: Engineer  
**Ratified**: Director (2026-01-13)