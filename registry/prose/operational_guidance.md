## 🚦 Operational Guidance

Warden is designed around the principle of **Atomic Turns**. Every engineering cycle follows a deterministic lifecycle.

### 1. Project Injection (Installation)
#### clone and set env
```bash
git clone https://github.com/apnex/warden
export WARDEN_ROOT=$PWD/warden
```

#### register target project
```bash
cd <target/project/dir>
$WARDEN_ROOT/warden system init
```

#### launch cli
```bash
opencode 
```

#### bootstrap prompt
```text
You are the Engineer in this session.
To initialize the environment and protocols, execute:
./warden init ONBOARD_V4 "Project Induction"
```

### 3. Development Cycles (GSD)
Most work is performed using the Gated Sequential Development (`GSD`) protocol:
- **SURVEY**: Assess the current state and dependencies.
- **PLAN**: Draft a technical blueprint and secure Director approval.
- **EXECUTE**: Perform work via `./warden exec "<cmd>"`.
- **VERIFY**: Present deliverables for final audit.
- **FINALIZE**: Synchronize documentation and close the cycle.

### 4. Cognitive Halts
If the engine stops and says **"Await Director Input,"** stop all work. This is a deliberate turn boundary designed to ensure alignment before high-stakes transitions.
