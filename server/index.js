import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use('/public', express.static(path.join(__dirname, 'public')));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Track which rooms have an active agent
const activeAgents = new Map(); // roomId -> socketId

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('join-room', (roomId) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = roomId;
    socket.join(roomId);
    console.log(`[Server] ${socket.id} joined: ${roomId}`);
    socket.to(roomId).emit('viewer-joined');
  });

  // Agent announces it is online for a room
  socket.on('agent-online', (roomId) => {
    activeAgents.set(roomId, socket.id);
    console.log(`[Server] Agent online in room: ${roomId}`);
  });

  // Viewer checks if a room's agent is online
  socket.on('check-room-status', (roomId, callback) => {
    const agentSocketId = activeAgents.get(roomId);
    if (agentSocketId && io.sockets.sockets.get(agentSocketId)) {
      callback({ online: true });
    } else {
      activeAgents.delete(roomId); // cleanup stale
      callback({ online: false });
    }
  });

  socket.on('viewer-ready', () => {
    if (currentRoom) {
      console.log(`[Server] Viewer in ${currentRoom} is ready.`);
      socket.to(currentRoom).emit('viewer-ready');
    }
  });

  socket.on('signal', (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit('signal', data);
    }
  });

  socket.on('mouse-move', (data) => {
    if (currentRoom) socket.to(currentRoom).emit('mouse-move', data);
  });

  socket.on('mouse-click', (data) => {
    if (currentRoom) socket.to(currentRoom).emit('mouse-click', data);
  });

  socket.on('key-event', (data) => {
    if (currentRoom) socket.to(currentRoom).emit('key-event', data);
  });

  socket.on('disconnect', () => {
    console.log(`[Server] Disconnected: ${socket.id}`);
    // Remove from active agents if this was an agent
    for (const [roomId, agentId] of activeAgents.entries()) {
      if (agentId === socket.id) {
        activeAgents.delete(roomId);
        console.log(`[Server] Agent went offline in room: ${roomId}`);
        // Notify viewers in the room
        io.to(roomId).emit('agent-offline');
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`[Signaling Server] Listening on port ${PORT}`);
});
