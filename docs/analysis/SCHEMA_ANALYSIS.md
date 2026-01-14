# Analysis of Deliverable Semantic Fidelity

## Executive Summary
This analysis addresses the "Semantic Gap" in the Warden Governance system by proposing a transition from low-fidelity (Array-based) schemas to high-fidelity (Object-based JSON Schema) definitions for all system deliverables. The goal is to provide future ZK entities with the necessary context, constraints, and examples to maintain audit fidelity.

## Shared Schema Traits (by KIND)

### 1. ACK (Acknowledgements & Approvals)
**Purpose**: External Director authorization signals.
**Proposed Enhancement**: Include a `source_identity` and `hash_reference`.
**Example Schema**:
```json
{
  "type": "object",
  "properties": {
    "status": { "enum": ["Approved", "Ratified", "Rejected"], "description": "The final decision." },
    "approver": { "type": "string", "description": "Identity of the Director." },
    "hash_ref": { "type": "string", "description": "SHA-256 hash of the artifact being approved." }
  }
}
```

### 2. RPT (Telemetry Reports)
**Purpose**: Automated system interaction data.
**Proposed Enhancement**: Include session metadata (Duration, Start/End).
**Example Schema**:
```json
{
  "type": "object",
  "properties": {
    "objective": { "type": "string" },
    "claims": { "type": "array" },
    "telemetry": {
      "type": "object",
      "properties": {
        "duration_ms": { "type": "number" },
        "tool_count": { "type": "number" }
      }
    }
  }
}
```

## Deliverable Audit Matrix

| ID | KIND | Existing Fidelity | Proposed Improvements |
| :--- | :--- | :--- | :--- |
| DLR_HND_ONBOARD | HND | LOW (Array) | Add `principles_accepted` (bool), `engineer_handle`. |
| DLR_MAN_ENV | MAN | LOW (Empty) | Add `node_version`, `os_platform`, `cpu_count`. |
| DLR_MAP_STRUCT | MAP | LOW (Empty) | Add `domains_discovered` (array), `boundary_warnings`. |
| DLR_ACK_SURVEY | ACK | LOW (Empty) | Add `survey_summary`, `authorization_token`. |
| DLR_DOC_GLOSSARY| DOC | LOW (Empty) | Add `term_count`, `last_synced`. |
| DLR_RPT_INTERACTION| RPT | MED (Array) | Add `session_id`, `claims_count`, `duration`. |
| DLR_ASM_COMPLIANCE| ASM | MED (Array) | Add `trust_score`, `gap_analysis` (string). |
| DLR_CRT_PROFICIENCY| CRT | LOW (Empty) | Add `engineer_level`, `demonstrated_protocols`. |
| DLR_SNA_INTEGRITY | SNA | LOW (Empty) | Add `protocol_hashes` (map), `checksum_status`. |
| DLR_TRC_ERROR | TRC | LOW (Empty) | Add `stack_trace`, `source_file`, `line_number`. |
| DLR_REV_PIR | REV | MED (Array) | Add `success_score` (number), `remediations` (array). |
| DLR_KNO_ENTRY | KNO | LOW (Empty) | Add `anomaly_ref`, `lesson_learned`, `mitigation`. |

## Conclusion & Next Steps
This analysis forms the basis for **CON-007: Semantic Schema Uplift**. It is recommended to implement these schemas iteratively, starting with the `AUD` and `RPT` kinds to harden the compliance loop.
