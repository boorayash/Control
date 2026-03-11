# Phase 1: Foundation Architecture - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Initial setup of the Signaling Server (Node.js/Socket.IO), Viewer Web App (React), and Node.js Host Agent to handle connections.
</domain>

<decisions>
## Implementation Decisions

### Repository Structure
- Simple separate folders for each component (`server`, `viewer`, `agent`) rather than a monorepo.

### Viewer Framework
- Vite + React for low latency and simplicity.

### Desktop Agent Approach
- Electron app for the desktop agent (allows for a UI window later, e.g., for the permission toggle and status).

### Component Library
- Pre-built Tailwind CSS components (e.g., shadcn/ui) for a premium feel.

### Claude's Discretion
- Specific folder/file naming conventions within the separate directories.
- Initial setup configurations (linters, formatters).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None (greenfield project).

### Established Patterns
- None (greenfield project).

### Integration Points
- None yet.

</code_context>

<specifics>
## Specific Ideas

- Ensure Vite is used for the frontend due to latency considerations.
- Electron is specifically requested for the host agent.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-architecture*
*Context gathered: 2026-03-11*
