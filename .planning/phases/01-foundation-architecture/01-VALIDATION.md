---
phase: 1
slug: 01-foundation-architecture
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node builtin `node --check` / Vite build |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm run build` or `node --check` |
| **Full suite command** | System execution verifications |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` or syntax checks
- **After every plan wave:** Verify the servers start
- **Before `/gsd:verify-work`:** All servers must boot successfully
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | ARCH-02 | unit | `cd server && npm run build` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | ARCH-03 | unit | `cd viewer && npm run build` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 1 | ARCH-01 | unit | `cd agent && npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/package.json` — Express & Socket.IO
- [ ] `viewer/package.json` — Vite & React
- [ ] `agent/package.json` — Electron

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Electron window launches | ARCH-01 | GUI application | Run `npm start` in `agent` directory and visually verify window appears |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-11
