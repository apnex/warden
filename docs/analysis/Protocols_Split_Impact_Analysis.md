# Impact Analysis: Splitting protocols.json

## 1. Executive Summary
The proposal to split the monolithic `protocols.json` into distributed files (e.g., `registry/protocols/*.json`) has been analyzed against Warden's core goals. 

**Recommendation:** **REJECT** the split. Maintain the Monolith.

## 2. Analysis Matrix

| Feature | Monolith (Current) | Distributed (Proposed) | Impact |
| :--- | :--- | :--- | :--- |
| **Integrity** | Single SHA-256 hash of one file. | Merkle Tree or Manifest Hash of N files. | 🔴 High Complexity Risk. Harder to prove "System State" at a glance. |
| **Atomicity** | All-or-Nothing load. | Partial loads possible (e.g., File A loads, File B fails). | 🔴 Critical Risk. System could enter undefined state. |
| **Governance** | `gov.js` modifies one object. | `gov.js` must manage file I/O, race conditions, and rollback across N files. | 🔴 High Dev Cost. |
| **Versioning** | Single Version (System v2.0.0). | Complex Version Matrix (GSD v5, CAP v1, etc.). | 🟡 Medium. Adds cognitive load. |

## 3. Warden Principles Check

*   **GOAL_FIDELITY:** The Monolith provides a single "Integrity Artifact". If `protocols.json` matches the hash, the *entire* law is verified. Splitting it diffuses this certainty.
*   **GOAL_PROTECT:** A single file is easier to "Firewall" than a directory of files which might accumulate "ignored" or "shadow" protocols.

## 4. Conclusion
The "Monolith" structure serves the Warden's purpose of **Deterministic Constraint** better than a distributed structure. The friction of a large file is a *feature*, not a bug, as it discourages trivial changes.
