import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('join-room', (roomId) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = roomId;
    socket.join(roomId);
    console.log(`[Signaling Server] ${socket.id} joined: ${roomId}`);
    
    // Notify EXPLAIN-WHY: Using broadcast to room ensures the other peer knows to start signaling
    socket.to(roomId).emit('viewer-joined');
  });

  socket.on('viewer-ready', () => {
    if (currentRoom) {
      console.log(`[Signaling Server] Viewer in ${currentRoom} is ready.`);
      socket.to(currentRoom).emit('viewer-ready');
    }
  });

  socket.on('signal', (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit('signal', data);
    }
  });

  // Relay Remote Control events per-room
  socket.on('mouse-move', (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit('mouse-move', data);
    }
  });

  socket.on('mouse-click', (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit('mouse-click', data);
    }
  });

  socket.on('key-event', (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit('key-event', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Signaling Server] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`[Signaling Server] Listening on port ${PORT}`);
});
