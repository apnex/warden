# FEAT_INITIALIZATION_FIX: Idempotent Initialization

## Status: PROPOSED
## Domain: Operational
## SQA Anchors: robustness

## 1. Problem Statement
The `./warden init` command fails with `ENOENT: no such file or directory` when attempting to save the initial state if the `.warden/state` directory does not already exist. This prevents successful initialization of new WARDEN root directories.

## 2. Proposed Solution
Modify `engine/warden.js` to ensure that the target directory for state and audit files exists before performing any write operations. This will be achieved by adding recursive directory creation logic in the `saveStack` and `updateInternalAudit` functions.

## 3. Implementation Details
- **Location:** `engine/warden.js`
- **Logic:**
  - Wrap `fs.writeFileSync` calls for `STATE_FILE` and `AUDIT_FILE`.
  - Use `path.dirname()` to get the target directory.
  - Call `fs.mkdirSync(dir, { recursive: true })`.

## 4. Verification Plan
1. Manually delete the `.warden/state` directory.
2. Run `./warden init ONBOARD_V4 "Verification Test"`.
3. Confirm the command completes successfully and the directory is recreated.
