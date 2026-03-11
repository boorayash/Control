# Web-based Remote Access Project

## What This Is

A minimalistic, web-based tool for live screen sharing and remote desktop control. It allows one system (the Host) to share its screen and grant explicit remote control permissions to another system (the Viewer) via a clean, browser-based interface.

## Core Value

Direct, low-latency screen sharing and remote control with zero visual noise or unnecessary popups, requiring explicit permissions.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Host application to capture screen and execute OS-level input
- [ ] Signaling server to handle connections, permissions, and input routing
- [ ] Viewer web app to display screen via WebRTC and capture user mouse/keyboard input
- [ ] WebRTC peer-to-peer video streaming from Host to Viewer
- [ ] Explicit permission flow (grant/revoke control access)

### Out of Scope

- [ ] Accessing another system's OS directly from a browser without a host agent
- [ ] File transfer

## Context

Project is being built for an academic/educational presentation.
The architecture requires a split between a desktop agent (for the host) and a web app (for the viewer), brokered by a signaling server.
UI will use Tailwind CSS for a premium aesthetic.

## Constraints

- **Tech Stack**: WebRTC for video, Socket.IO for signaling and control events.
- **Cost**: Must be built using 100% free/open-source tools.
- **Security**: Must enforce explicit permission before granting desktop control.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Desktop Agent | Required to capture OS events since browsers cannot directly | — Pending |
| Tailwind CSS | Deliver a rich, dynamic aesthetic based on user preference | — Pending |
| WebRTC | Low latency required for video, WebSockets are too slow | — Pending |

---
*Last updated: 2026-03-11 after initialization*
