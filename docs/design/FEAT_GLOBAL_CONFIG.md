# Design Specification: Global Engine Configuration

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_GLOBAL_CONFIG |
| **Concept** | CON-010 (Context-Agnostic Governance) |
| **Status** | IN_PROGRESS (IDEA-039 Implementation) |
| **Domain** | Warden Core / Configuration |
| **Reference** | IDEA-039 (Architecture Decoupling) |

## 1. Executive Summary
This feature establishes a centralized configuration management system for the Warden Engine. It provides a persistent global store (`config.json`) and CLI tools to manage settings that apply across the entire project fleet, such as default audit levels, security constraints, and operational preferences.

## 2. Problem Statement: Scattered and Volatile Settings
Currently, Warden lacks a unified mechanism for persisting global engine settings. Configuration is either:
- **Hardcoded**: Brittle and difficult to modify.
- **Environment-based**: Volatile and requires manual setup for every session.
- **Implicit**: Hidden within the toolchain's logic.

This prevents the Director from enforcing uniform governance policies or setting persistent operational preferences across multiple projects.

## 3. Solution Architecture: Global Config Store

### 3.1 Persistence Layer
- **Storage**: `ENGINE_ROOT/state/config.json`.
- **Schema**: Validated JSON structure.
- **Initial Keys**:
    - `audit_level`: [normal|strict|permissive]
    - `telemetry`: [true|false]
    - `default_author`: "Engineer"
    - `allowed_tools`: ["node", "npm", "git"]

### 3.2 Configuration API
- **Logic**: Centralize access via `resolve.global('config.json')`.
- **Loading**: The Engine loads the global config at startup, merging it with environment variable overrides.

### 3.3 CLI Interface (`warden system config ...`)
1.  **`list`**: Display all current configuration keys and values.
2.  **`get <key>`**: Retrieve the value of a specific configuration item.
3.  **`set <key> <value>`**: Persistently update a configuration item.

## 4. Operational Requirements

### 4.1 Resolver Integration
Harden `path_resolver.js` to provide easy access to the global config file.

### 4.2 Merging Strategy
The engine will resolve configuration using the following priority (highest to lowest):
1. Environment Variables (e.g., `WARDEN_AUDIT_LEVEL`)
2. Global Config (`config.json`)
3. Hardcoded Defaults

## 5. Implementation Strategy
1.  **Phase 1**: Update `path_resolver.js` to support `resolve.global('config.json')`.
2.  **Phase 2**: Implement `cmdSystemConfig` in `warden.js` (list, get, set).
3.  **Phase 3**: Integrate config loading into the `warden.js` boot sequence.
4.  **Phase 4**: Verification via persistence and override tests.

---
**Status**: DRAFTING (GSD Cycle Active)  
**Author**: Engineer  
**Reference**: [CON_ARCHITECTURE_DECOUPLING.md](../../registry/concepts/CON_ARCHITECTURE_DECOUPLING.md)
