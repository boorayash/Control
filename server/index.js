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
  console.log(`[Signaling Server] Client connected: ${socket.id}`);

  socket.on('signal', (data) => {
    socket.broadcast.emit('signal', data);
  });

  // Relay Remote Control events
  socket.on('mouse-move', (data) => {
    socket.broadcast.emit('mouse-move', data);
  });

  socket.on('mouse-click', (data) => {
    socket.broadcast.emit('mouse-click', data);
  });

  socket.on('key-event', (data) => {
    socket.broadcast.emit('key-event', data);
  });

  socket.on('join', () => {
    console.log(`[Signaling Server] Viewer joined: ${socket.id}`);
    socket.broadcast.emit('viewer-joined');
  });

  socket.on('disconnect', () => {
    console.log(`[Signaling Server] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`[Signaling Server] Listening on port ${PORT}`);
});
