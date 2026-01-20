## 🏗️ Architecture: The Service-Context Model

Warden operates on a decoupled **Anchor + Proxy** architecture, separating the governance logic from the project context.

### 1. The Central Engine (Mechanism)
The core logic resides in a central installation (the `ENGINE_ROOT`). This includes:
- **`warden.js`**: The executor that parses state machines and proxies commands.
- **`oracle.js`**: The knowledge layer providing protocol guidance and behavioral certification.
- **`path_resolver.js`**: The deterministic logic that manages path mapping between the engine and the target.

### 2. The Project Anchor (Context)
A hidden `.warden/` directory at the project root acts as the "Anchor." It contains:
- **`state/`**: The active governance cycle and the immutable `session.log` audit trail.
- **`registry/`**: Project-specific overrides for standards, glossary, and attributes.
- **`patches/`**: A record of the "Deltas" produced during governance turns.

### 3. The Proxy (Bridge)
A lightweight `warden` script in the project root forwards commands to the central engine, automatically injecting the correct project context. This allows Warden to be omnipresent but non-intrusive.
