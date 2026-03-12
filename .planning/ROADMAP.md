# Roadmap: Web-based Remote Access Project

## Overview

A minimalistic, direct, low-latency screen sharing and remote control web tool built with a Host Node.js/Electron agent, a Node.js Socket.IO Signaling Server, and a React Viewer Client.

## Phases

- [ ] **Phase 1: Foundation Architecture** - Setup server, web app, and host agent structures
- [ ] **Phase 2: Screen Streaming** - Implement WebRTC video streaming from host to viewer
- [ ] **Phase 3: Remote Control Input** - Capture viewer input and execute natively on host
- [ ] **Phase 4: Permissions & Polish** - Add explicit permission flow and clean UI

## Phase Details

### Phase 1: Foundation Architecture
**Goal**: The signaling server can handle connections between the Host Agent and Viewer Client.
**Depends on**: Nothing
**Requirements**: ARCH-01, ARCH-02, ARCH-03
**Success Criteria**:
  1. The Node.js Signaling Server starts correctly and accepts Socket.IO connections. 
  2. The Host Agent starts and connects to the server.
  3. The React Viewer Web App starts and connects to the server.
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Setup Node.js Signaling Server
- [ ] 01-02-PLAN.md — Setup React Viewer Client
- [ ] 01-03-PLAN.md — Setup Node.js Host Agent

### Phase 2: Screen Streaming
**Goal**: The viewer can see the remote host's screen in real-time.
**Depends on**: Phase 1
**Requirements**: STRM-01, STRM-02
**Success Criteria**:
  1. Host Agent reliably captures and streams the desktop video feed.
  2. Viewer correctly displays the incoming video feed with minimal latency.
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Establish Signaling Server WebRTC broker
- [ ] 02-02-PLAN.md — Implement Host Agent screen capturing and WebRTC streaming 
- [ ] 02-03-PLAN.md — Implement Viewer video rendering

### Phase 3: Remote Control Input
**Goal**: The viewer can control the remote host's mouse and keyboard.
**Depends on**: Phase 2
**Requirements**: CTRL-01, CTRL-02, CTRL-03, CTRL-04
**Success Criteria**:
  1. Viewer successfully captures mouse and keyboard events.
  2. Viewer transmits events accurately via Socket.IO.
  3. Host securely receives and executes native OS inputs.
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md — Viewer input capture and Socket.IO emitting
- [ ] 03-02-PLAN.md — Host Native OS input execution

### Phase 4: Permissions & Polish
**Goal**: Implement strict permission toggles and finalize the minimalistic UI design.
**Depends on**: Phase 3
**Requirements**: UIPR-01, UIPR-02, UIPR-03
**Success Criteria**:
  1. Host control cannot occur unless the permission toggle is explicitly enabled.
  2. Status indicators correctly reflect connection and control states.
  3. The UI uses a premium Tailwind CSS aesthetic with no extra bloat.
**Plans**: 2 plans

Plans:
- [ ] 04-01: UI permissions logic and status indicator
- [ ] 04-02: Final Tailwind CSS Polish

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Architecture | 0/3 | Not started | - |
| 2. Screen Streaming | 0/3 | Not started | - |
| 3. Remote Control Input | 0/2 | Not started | - |
| 4. Permissions & Polish | 0/2 | Not started | - |
