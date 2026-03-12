# Phase 3: Remote Control Input - Context

**Gathered:** 2026-03-12
**Status:** In Discussion

<domain>
## Phase Boundary

Capturing user input (mouse and keyboard) on the Viewer Client and executing it natively on the Host Agent system.
</domain>

<decisions>
## Implementation Decisions

### Input Execution Library
- Use `robotjs` for native input execution (with `nut-js` as a fallback if build errors occur).

### Coordinate Mapping
- Use normalized coordinates (0.0 to 1.0) on the viewer side, scaled to host screen dimensions on the agent side.

### Keyboard Support
- Standard US QWERTY for v1.

### Performance / Throttling
- Throttle mouse move events to ~60fps (approx every 16ms) on the viewer side.

### Security / Permissions
- No explicit permission toggle for Phase 3; input events will be executed immediately upon connection. Permission logic is deferred to Phase 4.

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/index.js`: Socket.IO handler can be extended for input events.
- `viewer/src/App.jsx`: React component can add event listeners to the video element.
- `agent/main.js`: Electron main process can handle incoming IPC from renderer to execute native commands.

### Established Patterns
- Socket.IO event broadcasting (used for signaling, can be adapted for control).
- IPC communication in the Electron agent.
</code_context>

<specifics>
## Specific Ideas

- The viewer's video element will serve as the "input surface".
- Clicking on the video element calculates the offset relative to the element's bounds, normalizes it, and sends it to the agent.
- Keyboard events are captured when the viewer window/video element has focus.

</specifics>

---

*Phase: 03-remote-control-input*
*Context gathered: 2026-03-12*
