# Concept: Feature Artifact Formalization (CON-009)

**Status:** INCUBATING (IDEA-023)
**Date:** 2026-01-15
**Source Idea:** registry/ideas/IDEA_Feature_Formalization.json

## 1. Objective
To close the fidelity gap between "Design" (Concept) and "Execution" (Code) by mandating a standardized **Feature Plan** (`FEAT`) artifact within the GSD lifecycle.

## 2. The Problem
*   **Transient Planning:** `GSD_V5` currently relies on a transient CLI log (`DLR_PLN_GSD`) for planning. When the session ends, the detailed technical plan is effectively lost to the scrollback.
*   **Tool Mismatch:** The `IDEA_V1` protocol requirements (create/refine) do not match the current `idea.js` capabilities.

## 3. The Solution

### 3.1 Taxonomy: Plan vs. Feature
We distinguish between the **Process** (GSD Plan) and the **Product** (Feature Spec).

| Artifact | Type | Persistence | Purpose |
| :--- | :--- | :--- | :--- |
| **Feature Spec** (`FEAT_*.md`) | Markdown | **Permanent** | The "Blueprint". Defines architecture, data models, and logic. Evolves with the codebase. |
| **GSD Plan** (`DLR_PLN_GSD`) | JSON Log | **Transient** | The "Contract". Defines the specific scope of work for *this* cycle (e.g., "Implement Phase 1 of FEAT_X"). |

**Relationship:** The GSD Plan is *derived* from the Feature Spec. The Feature Spec acts as the "Source of Truth" for the architecture.

### 3.2 GSD Protocol Upgrade (v5.9.0)
Update `GSD_V5` state `2_PLAN` to enforce this relationship:

*   **Interaction Banner:** Explicitly instructs the entity to "Draft the Feature Spec" before "Submitting the Plan".
*   **Requirement:** `feature_spec` (File Check for `docs/design/FEAT_*.md`).
*   **Requirement:** `sqa_anchoring` (Remains the same).

### 3.3 Tooling Upgrade (engine/idea.js)
Refactor `engine/idea.js` to match the `IDEA_V1` v1.1.0 specification and support the new workflow:
*   `--create <title> <desc>`
*   `--refine <id> <note>`
*   `--promote <id>`

## 4. The Artifact: Feature Plan (FEAT)
Standardized Markdown structure for `docs/design/FEAT_XXX.md`:
```markdown
# Feature: [Title]
**Status:** DRAFT | APPROVED
**Concept:** [Link to CON-XXX]

## 1. Technical Specification
Detailed breakdown of files, functions, and data structures.

## 2. Verification Plan
How will this be tested?

## 3. Implementation Phasing
(Optional) If large, how is this broken down into multiple GSD cycles?
```

## 5. Impact
*   **Traceability:** Idea -> Concept -> Feature -> Code.
*   **Persistence:** The "How" is documented alongside the code.
*   **Flexibility:** One Feature can span multiple GSD Cycles.