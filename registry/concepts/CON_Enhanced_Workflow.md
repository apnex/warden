# Concept: Structured Idea-to-Concept Evolution (CON-008)

**Status:** INCUBATING (IDEA-022)
**Date:** 2026-01-15
**Source Idea:** registry/ideas/IDEA_Enhanced_Workflow.json

## 1. Objective
To codify a rigorous, Director-guided lifecycle for evolving abstract Ideas into concrete Design Concepts, ensuring that "Design" is fully ratified before "Implementation" (GSD) begins.

## 2. The Problem
Currently, `IDEA_V1` treats "Incubation" as a pass-through state. This leads to:
1.  **Premature Execution:** Ideas jumping straight to code without a solidified design.
2.  **Taxonomy Confusion:** No clear distinction between an "Idea" (the what), a "Concept" (the design), and a "Feature" (the how).
3.  **Low Fidelity:** `registry/concepts` currently uses JSON, which is insufficient for detailed architectural thought.

## 3. The Solution: A Three-Stage Fidelity Pipeline

### Stage 1: The Spark (IDEA)
*   **Artifact:** `registry/ideas/IDEA_XXX.json`
*   **Purpose:** Rapid capture of raw intent.
*   **Content:** Metadata, brief description, rough component list.
*   **Tool:** `node engine/idea.js --create`

### Stage 2: The Design (CONCEPT)
*   **Artifact:** `registry/concepts/CON_XXX.md` (Markdown)
*   **Purpose:** Iterative exploration of *behavior* and *logic*.
*   **The Incubation Loop (IDEA_V1: 2_INCUBATE):**
    1.  **Draft:** Engineer drafts the Markdown concept.
    2.  **Review:** Director provides feedback (`DLR_IDE_REVIEW`).
    3.  **Refine:** Engineer updates the Markdown.
    4.  **Ratify:** Director approves (`DLR_IDE_ACK`).
*   **Key Distinction:** The Concept defines **WHAT** the system will do and **WHY**, but not necessarily **HOW** (code-level implementation).

### Stage 3: The Implementation (FEATURE)
*   **Protocol:** `GSD_V5` (Planning Phase)
*   **Artifact:** `docs/design/FEAT_XXX.md` (or the GSD Plan)
*   **Purpose:** Technical specification for code execution.
*   **Input:** The ratified Concept (CON_XXX).
*   **Content:** File paths, function signatures, data structures, migration strategies.
*   **Relationship:** A Feature is the *instantiation* of a Concept.

## 4. Protocol Changes (IDEA_V1)

The `IDEA_V1` protocol will be updated to enforce this workflow:

**State: 2_INCUBATE**
*   **Banner:** `DIALOGUE_MODE`
*   **Instruction:** "Engage in iterative dialogue. Output must be a `registry/concepts/*.md` file."
*   **Requirement 1 (Dialogue):** Logged usage of `idea.js --refine` (or equivalent dialogue capture).
*   **Requirement 2 (Artifact):** Existence of `registry/concepts/CON_*.md`.
*   **Requirement 3 (Gate):** `DLR_IDE_ACK` token from the Director.

## 5. Artifact Migration
*   **Action:** Deprecate `registry/concepts/*.json`.
*   **Action:** Future Concepts must be Markdown.
*   **Action:** Existing design docs in `docs/design` that are pure concepts should eventually be migrated or linked.

## 6. Summary for ZK Entities
> "Don't write code until you have a Plan (Feature). Don't write a Plan until you have a Design (Concept). Don't design until you have an Idea."
