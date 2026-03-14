# Control: Remote Access & Screen Sharing

**Control** is a minimalistic, low-latency, web-based remote access tool. It allows you to share your screen and grant native mouse/keyboard control to a remote viewer via a browser, with security and performance as core priorities.

## 🚀 Features

-   **Instant Screen Streaming**: High-performance desktop capture using Electron's `desktopCapturer`.
-   **Native Remote Control**: Full mouse and keyboard control (guarded by explicit host permissions).
-   **Ultra-Low Latency**: Powered by WebRTC (Simple-Peer) for direct peer-to-peer data transmission.
-   **Isolated Sessions**: Room-based signaling ensures sessions are private and secure.
-   **Global Connectivity**: Integrated STUN servers enable access over the internet, bypassing NAT/firewalls.
-   **Modern Aesthetic**: Premium "Glassmorphism" UI with real-time status indicators.
-   **Pixel Precision**: Accurate coordinate mapping that handles high-DPI displays and "black bar" video scaling.

---

## 🏗️ Project Structure

The project is split into three core components:

| Component | Directory | Technology | Role |
| :--- | :--- | :--- | :--- |
| **Signaling Server** | `server/` | Node.js, Socket.IO | Brokers WebRTC connections and relays input events inside private rooms. |
| **Host Agent** | `agent/` | Electron, nut-js | The desktop app that captures the screen and executes native OS commands. |
| **Viewer Client** | `viewer/` | React, Vite | The web dashboard where you see the remote screen and control the host. |

---

## 🛠️ Installation

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Setup the Server
```bash
cd server
npm install
```

### 2. Setup the Host Agent
```bash
cd agent
npm install
```

### 3. Setup the Viewer Client
```bash
cd viewer
npm install
```

---

## 🚦 How to Use

### Local Testing (Same Machine/Network)

1.  **Start the Server**:
    ```bash
    cd server
    npm start
    ```
2.  **Launch the Agent**:
    ```bash
    cd agent
    npm start
    ```
    - Toggle **"Allow Remote Control"** to ON if you want the viewer to interact with your machine.
3.  **Open the Viewer**:
    ```bash
    cd viewer
    npm run dev
    ```
    - Open the URL (usually `http://localhost:5173`) in your browser.

### Remote Testing (Cross-Network)
Since the signaling server typically runs on `localhost`, you need to expose it to the internet to connect two different machines.

1.  **Expose Server**: Use a tool like [ngrok](https://ngrok.com/) to tunnel port 3000 (`ngrok http 3000`).
2.  **Update Socket URL**: Copy the resulting `https://...` URL and update the `socket` connection string in both `viewer/src/App.jsx` and `agent/index.html`.
3.  **Connect**: Run the Agent on the host machine and open the Viewer (pointed to the tunnel) on the remote machine.

---

## 🔒 Security

"Control" implements multiple layers of security:
-   **Permission Gate**: Remote control is disabled by default. The host must explicitly toggle it on.
-   **Room Isolation**: All WebRTC signals and input events are scoped to a private room ID.
-   **Input Guard**: The Agent's main process rejects all incoming input packets unless the permission toggle is active.

---

## 📜 Dependencies

-   **WebRTC**: `simple-peer`
-   **Signaling**: `socket.io`
-   **Native Input**: `@mintplex-labs/nut-js`
-   **Desktop App**: `Electron`
-   **Frontend**: `React` + `Vite` + `Tailwind CSS`
