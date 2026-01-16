# CON-008: Dynamic Architecture Living Maps

## 1. Problem Statement
The Warden system is a complex state machine with distributed dependencies. Understanding the system topology currently requires manual inspection of file structures and code, which is slow and prone to "Cognitive Drift." Zero-Knowledge entities struggle to visualize the "Big Picture" of how protocols and tools interact.

## 2. Proposed Solution
**Component:** A dedicated tool `engine/map.js` acting as the execution engine for `MAP_V2`.
**Purpose:** To provide **Dynamic Topology**. This tool transforms the `MAP_V2` protocol from a passive metadata check into an active cartographer of the system's physical and logical structure.

### Key Capabilities
1.  **Dependency Graphing:** Parse `engine/*.js` to detect `require()` and `child_process.exec` calls.
2.  **Protocol State Mapping:** Parse `registry/protocols/*.json` to visualize state transitions and gates.
3.  **Visual Output:** Output `.mmd` (Mermaid) content to stdout or a file.

## 3. Mapping Scope
The Cartographer will target two specific layers of abstraction:
1.  **Physical Layer (Code):** Hard dependencies between JS files.
2.  **Logical Layer (Governance):** State machine transitions.

## 4. ZK Usage Strategy
*   **Rapid Scanning:** The `.mmd` text provides a condensed "cheat sheet" of relationships.
*   **Verification:** Embedding maps in reports (`DLR_RPT_...`) for Director verification.

## 5. Interface Specification
**Command:** `node engine/map.js [target] [options]`

**Targets:**
*   `system`: High-level component diagram.
*   `protocol <ID>`: State Machine graph.
*   `deps`: File-level dependency graph.

**Options:**
*   `--format <mmd|json>`: Default Mermaid.

## 6. Strategic Architecture
This solution decouples "Topology" (Map) from "Guidance" (Oracle). It empowers the `MAP_V2` protocol with a dedicated active tool, allowing future expansion into Impact Analysis and Heatmapping without bloating the Oracle.

## 7. Technical Approach

## 7. Technical Approach
*   **Parser:** A regex-based static analyzer for JS files.
*   **Graph Builder:** A lightweight graph structure (Nodes/Edges).
*   **Renderer:** A Mermaid syntax generator (e.g., `graph TD; A-->B;`).
*   **Export Options:** Default to `.mmd` (text). Optional support for `mmdc` (Mermaid CLI) for PNG/SVG generation if the tool is present in the environment.
*   **Constraints:** Interactive navigation (SVG links) is out of scope for MVP.

## 4. Success Criteria
*   Generating a map of `warden.js` correctly shows edges to `engine/onboard.js` and `registry/protocols.json`.
*   The output is valid Mermaid syntax.
