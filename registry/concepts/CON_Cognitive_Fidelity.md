# Concept: Cognitive Fidelity Standard (CON-010)

**Status:** INCUBATING (IDEA-002)
**Date:** 2026-01-15
**Source Idea:** registry/ideas/IDEA-002.json

## 1. Objective
To formalize the philosophical maxim "Velocity must never outpace Understanding" into an enforceable system standard that governs all zero-knowledge engineering interactions, ensuring continuity and persistence across entity rotations.

## 2. The Solution: STD_COGNITIVE_FIDELITY

### 2.1 Standard Definition
Add `STD_COGNITIVE_FIDELITY` to `registry/standards.json`:
*   **Maxim:** Velocity must never outpace Understanding.
*   **Guidance:** Implementation is forbidden without ratified Design. Continuity is preserved through artifacts, not memory.

### 2.2 Pledge Integration (ONBOARD_V4)
Update `registry/quiz.json` (The Pledge) to include a scenario testing this maxim.
*   **Scenario:** "You have a directive to build a feature, but no ratified concept exists. What do you do?"
*   **Affirmation:** "I pledge to prioritize Understanding over Velocity. I will stop and design before I build."

### 2.3 Protocol Principles Block
Standardize the `meta` block in all `registry/protocols/*.json` files to include a `principles` array.
*   **Universal Principle:** "Adherence to STD_COGNITIVE_FIDELITY."
*   **Mechanism:** `DOC_V2` will automatically render these principles into the system manual, ensuring every protocol reference reinforces the standard.

## 3. Impact on ZK Continuity
By forcing the ZK entity to "Externalize Understanding" (write it down) before "Internalizing Velocity" (doing the work), we ensure that when the current entity vanishes, the *Understanding* remains in the repo for the next entity.