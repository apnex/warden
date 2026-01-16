---
id: FEAT_LivingMaps
title: Dynamic Architecture Living Maps
status: DRAFT
concept: CON-008
priority: P2
---

# Feature: Dynamic Architecture Living Maps

## 1. Overview
A dedicated CLI tool (`engine/map.js`) that generates visual topology graphs of the Warden system by parsing code dependencies and governance metadata. This acts as the execution engine for the `MAP_V2` protocol.

## 2. Technical Specification
*   **Path:** `engine/map.js`
*   **Dependencies:** `fs`, `path`, `child_process` (standard node libs only).
*   **Output:** MermaidJS (`.mmd`) syntax to stdout.

### 2.1 Modules
1.  **Parser:**
    *   `parseDeps(file)`: Regex scan for `require(path)`.
    *   `parseProtocol(json)`: Extract states and transitions.
2.  **Graph Engine:**
    *   Internal representation of Nodes and Edges.
3.  **Renderer:**
    *   Convert internal graph to Mermaid graph syntax.

### 2.2 Interface
```bash
node engine/map.js system            # High-level architecture
node engine/map.js protocol GSD_V5   # State machine visualization
node engine/map.js deps              # Low-level code dependencies
```

## 3. Verification Plan
*   **Unit Tests:** Validate regex extraction for `require()` patterns.
*   **Integration Tests:** Verify `node engine/map.js system` produces valid Mermaid syntax.
*   **Manual Audit:** Visually verify graph accuracy against `registry/protocols.json`.

## 4. SQA Alignment
*   **Observability (Operational):** Provides real-time visibility into hidden system relationships.
*   **Maintainability (Structural):** Helps identify architectural debt through visual complexity analysis.