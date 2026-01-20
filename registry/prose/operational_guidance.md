## 🚦 Operational Guidance

Warden is designed around the principle of **Atomic Turns**. Every engineering cycle follows a deterministic lifecycle.

### 1. Project Injection (Installation)
To bring a new project under governance, use the system initialization command:
```bash
node engine/warden.js system init <target_path>
```
This scaffolds the anchor and creates the local `warden` proxy script.

### 2. The First Turn (Onboarding)
Once injected, initialize the onboarding protocol:
```bash
./warden init ONBOARD_V4 "Project Induction"
```
Follow the instructions to align your session and complete the behavioral pledge.

### 3. Development Cycles (GSD)
Most work is performed using the Gated Sequential Development (`GSD`) protocol:
- **SURVEY**: Assess the current state and dependencies.
- **PLAN**: Draft a technical blueprint and secure Director approval.
- **EXECUTE**: Perform work via `./warden exec "<cmd>"`.
- **VERIFY**: Present deliverables for final audit.
- **FINALIZE**: Synchronize documentation and close the cycle.

### 4. Cognitive Halts
If the engine stops and says **"Await Director Input,"** stop all work. This is a deliberate turn boundary designed to ensure alignment before high-stakes transitions.
