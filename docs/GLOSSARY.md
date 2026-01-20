# 📖 System Glossary

> Authoritative definitions for the Warden Governance ecosystem and project-specific domains.

## 🌐 STRATEGIC Domain (Global)
*High-level outcomes and terminal states.*

| UID | Term | Definition | Source |
|:---|:---|:---|:---|
| `TRM_GOAL` | **Goal** | A high-level strategic outcome registered in goals.json. It represents the terminal state or desired result of system evolution. | Global |

## 🌐 OPERATIONAL Domain (Global)
*Lifecycle management and governance boundaries.*

| UID | Term | Definition | Source |
|:---|:---|:---|:---|
| `TRM_MSN` | **Mission** | A governed instance of execution (Protocol Cycle) designed to satisfy a specific subset of a Goal. | Global |
| `TRM_GSD_PLAN` | **GSD_PLAN** | A formal deliverable contract between Engineer and Director, defining the tactical approach for a Mission. | Global |

## 🌐 TACTICAL Domain (Global)
*Specific implementation targets and constraints.*

| UID | Term | Definition | Source |
|:---|:---|:---|:---|
| `TRM_OBJ` | **Objective** | The specific technical or procedural target of a Mission. It serves as both a concept (the destination) and a data field (the plan definition). | Global |
| `TRM_STD` | **Standard** | A codified set of best practices or technical constraints (e.g., STD_FILE_CONSOLIDATION) that must be applied to an Objective. | Global |
| `TRM_FEAT_SPEC` | **Feature Specification** | A persistent Markdown artifact (FEAT_*.md) that defines the technical architecture and logic of a system capability. | Global |

## 🌐 GOVERNANCE Domain (Global)
*Audit fidelity and interaction classification.*

| UID | Term | Definition | Source |
|:---|:---|:---|:---|
| `TRM_CAN_INTENT` | **Canonical Intent** | A standardized JSON representation of a CLI command, used to eliminate semantic ambiguity in audit logs. | Global |
| `TRM_INT_DISPATCH` | **Intent Dispatcher** | The component within Warden that resolves raw shell strings into structured objects using metadata patterns. | Global |
| `TRM_SHADOW_ACT` | **Shadow Action** | Any system-level command executed through the governance proxy that does not map to a recognized canonical intent. | Global |

---
*Generated via Warden Glossary Tool*
