# Design Specification: Project-Centric Documentation Workflow

| Metadata | Value |
| :--- | :--- |
| **Feature ID** | FEAT_PROJECT_DOCS |
| **Concept** | CON-010 (Context-Agnostic Governance) |
| **Status** | IN_PROGRESS (IDEA-039 Alignment) |
| **Domain** | Warden Core / Documentation |
| **Reference** | IDEA-039 (Architecture Decoupling) |

## 1. Executive Summary
This feature refactors the Warden documentation toolchain to focus on the **Project Identity** when governing external targets. It formalizes the residency of the Project Changelog in the `.warden/` anchor and ensures all generated public artifacts (`docs/*.md`) reflect the project's unique goals, standards, and history.

## 2. Problem Statement: Engine-Centric Documentation
Currently, Warden's documentation generators are biased toward documenting Warden's own components. When governing an external project:
- **Changelogs**: Conflate engine updates with project features.
- **READMEs**: Focus on Warden's tools rather than the project's governance status.
- **Standards/Glossary**: Lack clear integration of local overrides.

## 3. Solution Architecture: Context-Aware Generators

### 3.1 Dual-Changelog Workflow
- **Project Changelog**: `TARGET_ROOT/.warden/changelog.json` -> Source for `TARGET_ROOT/docs/CHANGELOG.md`.
- **System Changelog**: `ENGINE_ROOT/history/governance_changelog.json` -> Tracks Warden Engine evolution.
- **Tooling**: Implement `docs/generate_changelog.js` to render the project-specific version history.

### 3.2 Dynamic Documentation Model
Refactor `generate_readme.js` and others to branch behavior based on `MODE` (Local vs. Proxy):
- **Local Mode**: Document Warden Engine (Dashboard, Debt, etc.).
- **Proxy Mode**: Document Project Governance (Active Cycle, Goals, Compliance Score).

### 3.3 Registry-to-Doc Overlay
Generators for Glossary and Standards must utilize the `resolve.registry()` functional API to automatically include:
1. Local Project Overrides (Priority).
2. Global SE Foundations (Fallback).

## 4. Implementation Strategy
1. **Phase 1**: Implement `docs/generate_changelog.js`.
2. **Phase 2**: Refactor `generate_readme.js` for "Project Manifesto" mode.
3. **Phase 3**: Update `finalizer.js` to coordinate the new project-centric sync.
4. **Phase 4**: Integrity Audit of generated project documentation.

---
**Status**: DRAFTING (GSD Cycle Active)  
**Author**: Engineer  
**Reference**: [CON_ARCHITECTURE_DECOUPLING.md](../../registry/concepts/CON_ARCHITECTURE_DECOUPLING.md)
