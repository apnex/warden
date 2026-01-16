# Feature: Feature Artifact Formalization & Tooling Upgrade
**Status:** DRAFT
**Concept:** [CON-009](registry/concepts/CON_Feature_Formalization.md)

## 1. Technical Specification

### 1.1 GSD_V5 Protocol Upgrade (v5.9.0)
*   **File:** `registry/protocols/GSD_V5.json`
*   **Target State:** `2_PLAN`
*   **Action:** 
    *   Add `feature_spec` requirement.
    *   Requirement Type: `file_exists`.
    *   Target Path: `docs/design/FEAT_*.md`.
    *   Instruction: "Draft the technical specification in Markdown before submitting the GSD Plan."

### 1.2 idea.js Tool Refactor
*   **File:** `engine/idea.js`
*   **Architecture:**
    *   Load/Save logic using `registry/ideas/IDEA_*.json` individual files.
    *   **Commands:** `--create`, `--refine`, `--promote`, `--archive`.

### 1.3 Registry Updates (Referential Integrity)
*   **Glossary:** Add `TRM_FEAT_SPEC` (Feature Specification).
*   **Standards:** Add `STD_FEAT_STRUCT` (Markdown Structure).
*   **Deliverables:** Add `DLR_DOC_FEAT` (Feature Document).

## 2. Verification Plan

### 2.1 Protocol Verification
*   Initialize a new `GSD_V5` cycle.
*   Transition to `2_PLAN`.
*   Verify that it correctly flags the missing `FEAT_*.md` file.

### 2.2 Tool Verification
*   `node engine/idea.js --create "Test Idea" "Test Desc"` -> Verify JSON created.
*   `node engine/idea.js --refine IDEA_XXX "Refinement Note"` -> Verify JSON updated.
*   `node engine/idea.js --promote IDEA_XXX` -> Verify Status updated.