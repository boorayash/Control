---
phase: 3
slug: 02-remote-control-input
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-12
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node builtin `node --check` / Vite build |
| **Config file** | none |
| **Quick run command** | `npm run build` or `node --check` |
| **Full suite command** | System execution verifications |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` (viewer) or syntax checks (agent)
- **After every plan wave:** Verify the servers and clients can restart
- **Before `/gsd:verify-work`:** Mouse and keyboard input must be visibly reflected on the host machine
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | CTRL-01, CTRL-02, CTRL-03 | unit | `cd viewer && npm run build` | ✅ | ⬜ pending |
| 3-02-01 | 02 | 1 | CTRL-04 | unit | `cd agent && node --check main.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `agent/package.json` — robotjs (or nut-js)
- [ ] `viewer/src/App.jsx` — Input event listeners

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Viewer mouse click moves host cursor | CTRL-01, CTRL-04 | Logic depends on OS-level interaction | Click on the viewer video. Verify the host cursor moves to the corresponding location. |
| Viewer keyboard input prints on host | CTRL-02, CTRL-04 | Logic depends on OS-level interaction | Focus viewer and type. Verify text appears in an open notepad/editor on host. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-12
