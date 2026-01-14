# Design Specification: Canonical Command Model & Structured Audit Uplift

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_STRUCTURED_AUDIT |
| **Concept** | CON-009 (Structured Interaction & Provenance) |
| **Status** | LIVE |
| **Domain** | Governance / Audit Fidelity |
| **Reference** | IDEA-031 |

## 1. Executive Summary
This feature transitions the Warden Governance system from **Textual Echo Matching** (string-based logs) to a **Structured Canonical Model** (object-oriented provenance). By intercepting and classifying intent at the moment of execution, we eliminate semantic ambiguity, resolve the "Audit Gap" (false negatives), and physically enforce cognitive analysis for unrecognized actions.

## 2. Problem Statement: The "Brittle Matcher" Debt
The initial compliance loop relied on matching shell-escaped and path-prefixed strings in the session log against manual claims.
- **False Negatives**: Variations in pathing or quoting resulted in 0% match scores for valid actions.
- **Velocity Bias**: ZK entities could execute "Shadow Actions" (unregistered tools) that were difficult to audit after the fact.
- **Temporal Drift**: Displacement between state transitions and logs caused filtering failures.

## 3. Solution Architecture: The Intent Engine

### 3.1 The Canonical Command Object
Every command executed via `warden.js exec` is transformed into a high-fidelity JSON object containing a `timestamp`, `source`, `protocol`, and a structured `intent` block (ID, tool, action, target).

### 3.2 Metadata-Driven Intent Parser (`registry/intent_patterns.json`)
The parsing logic uses a regex-to-intent mapping registry to classify raw CLI strings into canonical identities. This allows new tools to be added without engine refactoring.

### 3.3 The "Socratic Brake" (Option B Cognitive Interjection)
If a command does not match any registered pattern, execution is halted until the Engineer provides a qualitative justification via the `--justify` flag. This reasoning is persisted as a `DLR_AUD_INTERJECTION` token.

### 3.4 Deep Audit Scoping (Parent-Cycle Continuity)
To resolve the "Audit Gap" during sub-protocol ratification, the system supports metadata-driven scoping:
- **Attribute**: `audit_scope: parent` in protocol metadata.
- **Mechanism**: When active, `report.js` shifts its temporal window (`since`) to the start of the **Parent Cycle** instead of the active sub-cycle.
- **Fidelity**: Ensures that `CAP_V1` can verify the implementation history of its parent `GSD_V5` mission.

## 4. The Three-Way Verification Model
Compliance is achieved through the reconciliation of three independent views:
1.  **Engineer's Report (Subjective)**: Explicit claims of actions taken.
2.  **Warden's Logs (Objective)**: Canonical intent objects recorded during execution.
3.  **Compliance Assessment (Synthesis)**: The `DLR_ASM_COMPLIANCE` token, representing the bit-perfect delta analysis.

## 5. Automated Report Synthesis & Verification
Matching is transformed from a "Guessing Game" into an "Audit Review":
1.  **Drafting**: The `report.js --draft` tool aggregates all `intent.id` tokens from the current (or parent) cycle.
2.  **ID-First Matching**: The matcher prioritizes bit-identical ID checks. If IDs match, the action is **Verified** regardless of string variance.
3.  **Fuzzy Fallback**: For Shadow Actions, the system utilizes `sanitizeCommand` to perform normalized string matching (stripping quotes, colons, and extra whitespace).

## 6. Holistic System Integration
- **Glossary**: Added `Canonical Intent`, `Intent Dispatcher`, and `Shadow Action`.
- **Standards**: Codified `STD_CANONICAL_INTENT` requiring all cycle actions to be mapped or justified.
- **Verification**: `DLR_ASM_COMPLIANCE` serves as the final seal of mission fidelity.

---
**Status**: LIVE  
**Author**: Engineer  
**Ratified**: Director (2026-01-14)