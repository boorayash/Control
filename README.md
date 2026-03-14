<p align="center">
  <h1 align="center">CONTROL<span>.</span></h1>
  <p align="center">Ultra-low latency remote desktop for the modern web.</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
</p>

---

**Control** is a peer-to-peer remote desktop tool that lets you share your screen and grant native mouse & keyboard control to anyone through a browser. No accounts, no installs on the viewer side — just a permanent access code.

## ✨ Features

- **Persistent Access Code** — Your machine gets a unique code (e.g. `CTL-A7X9K2`) on first launch. Share it once, connect anytime.
- **Live Host Detection** — The viewer checks if the host is online before connecting. Green dot = online, red = offline.
- **Instant P2P Streaming** — WebRTC-powered direct connection. No video goes through the server.
- **Native Remote Control** — Full mouse and keyboard input, guarded by an explicit permission toggle.
- **Internet-Ready** — STUN servers handle NAT traversal. Works across different networks out of the box.
- **Room Isolation** — All signals and inputs are scoped to your private room. No leaking.
- **Landing Page** — Clean gateway with a "How It Works" guide, agent download, and session join.

---

## 🏗️ Architecture

```
┌─────────────┐     Socket.IO      ┌──────────────┐     Socket.IO      ┌─────────────┐
│  Host Agent │ ◄──────────────────► │   Signaling  │ ◄──────────────────► │   Viewer    │
│  (Electron) │     WebRTC (P2P)    │    Server    │                     │   (React)   │
│             │ ◄═══════════════════╪══════════════╪═══════════════════► │             │
└─────────────┘   Video + Control   └──────────────┘                     └─────────────┘
```

| Component | Directory | Stack | Role |
|:---|:---|:---|:---|
| **Signaling Server** | `server/` | Node.js, Express, Socket.IO | Brokers WebRTC handshakes, tracks online agents, relays input events |
| **Host Agent** | `agent/` | Electron, nut-js | Captures screen, executes native OS input, generates persistent access code |
| **Viewer Client** | `viewer/` | React, Vite, Tailwind CSS | Landing page, remote screen display, mouse/keyboard capture |

---

## 🚀 Quick Start

> **Prerequisites:** [Node.js](https://nodejs.org/) (v18+)

```bash
# 1. Start the signaling server
cd server && npm install && npm start

# 2. Launch the host agent (on the machine you want to share)
cd agent && npm install && npm start

# 3. Start the viewer (on any machine)
cd viewer && npm install && npm run dev
```

Open `http://localhost:5173` → Enter the **Access Code** shown on the Agent dashboard → **Join Session**.

---

## 🔑 How It Works

1. **Run the Agent** — Launch the Host Agent on the computer you want to share. It generates a permanent access code (e.g. `CTL-A7X9K2`) and displays it on the dashboard.
2. **Share the Code** — Give the code to whoever needs access. It never changes — share once, connect forever.
3. **Connect** — The viewer enters the code on the landing page. If the host is online, they click "Join Session" and get instant screen access.

### Remote Access (Cross-Network)

The signaling server runs on `localhost:3000` by default. To connect across networks:

1. **Expose the server** — Use [ngrok](https://ngrok.com/) or a cloud VM:
   ```bash
   ngrok http 3000
   ```
2. **Update socket URLs** — Replace `http://localhost:3000` with your public URL in:
   - `viewer/src/App.jsx` (line 5)
   - `agent/index.html` (socket connection line)
3. **Connect** — Run the Agent on the host, open the Viewer on the remote machine.

---

## 🔒 Security

- **Permission Gate** — Remote control is OFF by default. The host must explicitly toggle it on.
- **Room Isolation** — All WebRTC signals and input events are scoped to a private room ID.
- **Input Guard** — The Agent rejects all incoming input unless the permission toggle is active.
- **Online Tracking** — Server validates agent presence before allowing viewer connections.

---

## 📦 Building the Agent (.exe)

```bash
cd agent
npm run dist
```

The portable `.exe` will be generated in `agent/dist/`. Upload it as a [GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github) asset for distribution.

---

## 🧰 Tech Stack

| Layer | Technology |
|:---|:---|
| Desktop App | Electron |
| Native Input | @mintplex-labs/nut-js |
| Real-time Signaling | Socket.IO |
| Video Streaming | WebRTC (simple-peer) |
| Frontend | React + Vite + Tailwind CSS |
| Packaging | electron-builder |

---

## 📁 Project Structure

```
screen/
├── server/            # Signaling server
│   ├── index.js       # Express + Socket.IO + online tracking
│   └── public/        # Static file serving (agent downloads)
├── agent/             # Host agent (Electron)
│   ├── main.js        # Persistent room ID, native input, permissions
│   ├── index.html     # Agent dashboard UI
│   └── dist/          # Built .exe (gitignored)
└── viewer/            # Viewer client (React)
    ├── src/App.jsx    # Landing page + WebRTC session
    └── src/index.css  # Global styles + Inter font
```

---

## 📄 License

MIT
