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

### 1. Configure Environment Variables

Copy the `.env.example` files in each component and fill in your values:

```bash
# Server
cp server/.env.example server/.env   # Set PORT (default: 3000)

# Viewer
cp viewer/.env.example viewer/.env   # Set VITE_SERVER_URL

# Agent
cp agent/.env.example agent/.env     # Set SIGNALING_SERVER_URL
```

### 2. Run

```bash
# Start the signaling server
cd server && npm install && npm start

# Launch the host agent (on the machine you want to share)
cd agent && npm install && npm start

# Start the viewer (on any machine)
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
2. **Update your `.env` files** with the public URL:
   - `viewer/.env` → `VITE_SERVER_URL=https://your-id.ngrok-free.dev`
   - `agent/.env` → `SIGNALING_SERVER_URL=https://your-id.ngrok-free.dev`
3. **Connect** — Run the Agent on the host, open the Viewer on the remote machine.

---

## 🔒 Security

- **Permission Gate** — Remote control can be toggled on/off from the Agent dashboard.
- **Room Isolation** — All WebRTC signals and input events are scoped to a private room ID.
- **Input Guard** — The Agent rejects all incoming input unless the permission toggle is active.
- **Online Tracking** — Server validates agent presence before allowing viewer connections.

---

## 📦 Building the Agent Installer (.exe)

```bash
cd agent
node build-installer.js
```

> **Note:** On Windows, enable **Developer Mode** (Settings → System → For developers) or run as Administrator for the build to succeed.

This will:
1. Package the app with `electron-builder` (NSIS installer)
2. Output the installer to `agent/dist/ControlAgentInstaller.exe`
3. Auto-sync it to `server/public/downloads/` for the website download button

The installer includes a proper setup wizard with installation path selection, desktop shortcut, and Start Menu entry.

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
├── logo/                    # Source brand assets
├── server/                  # Signaling server
│   ├── index.js             # Express + Socket.IO + online tracking
│   ├── .env.example         # Environment variable template
│   └── public/              # Static file serving (agent downloads)
├── agent/                   # Host agent (Electron)
│   ├── main.js              # Persistent room ID, native input, permissions
│   ├── index.html           # Agent dashboard UI
│   ├── logo.png             # App icon & tray icon
│   ├── build-installer.js   # NSIS installer build script
│   ├── .env.example         # Environment variable template
│   └── dist/                # Built installer (gitignored)
└── viewer/                  # Viewer client (React)
    ├── src/App.jsx           # Landing page + WebRTC session
    ├── src/index.css         # Global styles + Inter font
    ├── public/logo.png       # Favicon & web assets
    └── .env.example          # Environment variable template
```
