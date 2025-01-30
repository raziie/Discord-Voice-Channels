const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');

require('dotenv').config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize HTTP server
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Instead of handling REST API requests (app.get, app.post), it listens for WebSocket events.
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinChannel', (channelId) => {
        socket.join(channelId);
        io.to(channelId).emit('userJoined', { socketId: socket.id });
    });

    socket.on('leaveChannel', (channelId) => {
        socket.leave(channelId);
        io.to(channelId).emit('userLeft', { socketId: socket.id });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
